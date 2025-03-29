package handlers

import (
	"bytes"
	"context"
	"errors"
	"io"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/conditional"
	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/middleware"
	"github.com/enchant97/note-mark/backend/services"
	"github.com/enchant97/note-mark/backend/storage"
	"github.com/google/uuid"
)

func SetupNotesHandler(
	api huma.API,
	appConfig config.AppConfig,
	storage_backend storage.StorageController,
	authProvider middleware.AuthDetailsProvider,
) {
	notesHandler := NotesHandler{
		Storage:      storage_backend,
		AuthProvider: authProvider,
	}
	huma.Register(api, huma.Operation{
		Method:        http.MethodPost,
		Path:          "/api/books/{bookID}/notes",
		Middlewares:   huma.Middlewares{authProvider.AuthRequiredMiddleware},
		DefaultStatus: http.StatusCreated,
	}, notesHandler.PostNoteByBookID)
	huma.Get(api, "/api/books/{bookID}/notes", notesHandler.GetNotesByBookID)
	huma.Get(api, "/api/notes/recent", notesHandler.GetNotesRecent)
	huma.Get(api, "/api/notes/{noteID}", notesHandler.GetNoteByID)
	huma.Get(api, "/api/notes/{noteID}/content", notesHandler.GetNoteContentByID)
	huma.Get(api, "/api/slug/{username}/books/{bookSlug}/notes/{noteSlug}", notesHandler.GetNoteBySlug)
	huma.Register(api, huma.Operation{
		Method:      http.MethodPut,
		Path:        "/api/notes/{noteID}",
		Middlewares: huma.Middlewares{authProvider.AuthRequiredMiddleware},
	}, notesHandler.PutNoteByID)
	huma.Register(api, huma.Operation{
		Method:      http.MethodPut,
		Path:        "/api/notes/{noteID}/restore",
		Middlewares: huma.Middlewares{authProvider.AuthRequiredMiddleware},
	}, notesHandler.RestoreNoteByID)
	huma.Register(api, huma.Operation{
		Method:       http.MethodPut,
		Path:         "/api/notes/{noteID}/content",
		Middlewares:  huma.Middlewares{authProvider.AuthRequiredMiddleware},
		MaxBodyBytes: int64(appConfig.NoteSizeLimit),
	}, notesHandler.UpdateNoteContentByID)
	huma.Register(api, huma.Operation{
		Method:      http.MethodDelete,
		Path:        "/api/notes/{noteID}",
		Middlewares: huma.Middlewares{authProvider.AuthRequiredMiddleware},
	}, notesHandler.DeleteNoteByID)
}

type NotesHandler struct {
	services.NotesService
	Storage      storage.StorageController
	AuthProvider middleware.AuthDetailsProvider
}

type PostNoteByBookIDInput struct {
	BookID uuid.UUID `path:"bookID" format:"uuid"`
	Body   db.CreateNote
}

type PostNoteByBookIDOutput struct {
	Body db.Note
}

type GetNotesRecentOutput struct {
	Body []db.ValueWithSlug
}

type GetNotesByBookIDInput struct {
	BookID  uuid.UUID `path:"bookID" format:"uuid"`
	Deleted bool      `query:"deleted"`
}

type GetNotesByBookIDOutput struct {
	Body []db.Note
}

type GetNoteByIDInput struct {
	NoteID uuid.UUID `path:"noteID" format:"uuid"`
}

type NoteOutput struct {
	Body db.Note
}

type GetNoteContentByIDInput struct {
	conditional.Params
	NoteID uuid.UUID `path:"noteID" format:"uuid"`
}

type GetNoteBySlugOutput struct {
	Username string `path:"username"`
	BookSlug string `path:"bookSlug"`
	NoteSlug string `path:"noteSlug"`
}

type PutNoteByIDInput struct {
	NoteID uuid.UUID `path:"noteID" format:"uuid"`
	Body   db.UpdateNote
}

type UpdateNoteContentByIDInput struct {
	conditional.Params
	NoteID  uuid.UUID `path:"noteID" format:"uuid"`
	RawBody []byte
}

type DeleteNoteByIDInput struct {
	GetNoteByIDInput
	Permanent bool `query:"permanent"`
}

func (h NotesHandler) PostNoteByBookID(ctx context.Context, input *PostNoteByBookIDInput) (*PostNoteByBookIDOutput, error) {
	authDetails, _ := h.AuthProvider.TryGetAuthDetails(ctx)
	userID := authDetails.GetAuthenticatedUser().UserID
	if note, err := h.NotesService.CreateNote(userID, input.BookID, input.Body); err != nil {
		if errors.Is(err, services.NotFoundError) {
			return nil, huma.Error404NotFound("book does not exist or you do not have access")
		} else if errors.Is(err, services.ConflictError) {
			return nil, huma.Error409Conflict("note with that slug already exists")
		} else {
			return nil, err
		}
	} else {
		return &PostNoteByBookIDOutput{
			Body: note,
		}, nil
	}
}

func (h NotesHandler) GetNotesRecent(ctx context.Context, input *struct{}) (*GetNotesRecentOutput, error) {
	authDetails, _ := h.AuthProvider.TryGetAuthDetails(ctx)
	optionalUserID := authDetails.GetOptionalUserID()
	if recent, err := h.NotesService.GetRecentNotes(optionalUserID); err != nil {
		return nil, err
	} else {
		return &GetNotesRecentOutput{
			Body: recent,
		}, nil
	}
}

func (h NotesHandler) GetNotesByBookID(ctx context.Context, input *GetNotesByBookIDInput) (*GetNotesByBookIDOutput, error) {
	authDetails, _ := h.AuthProvider.TryGetAuthDetails(ctx)
	optionalUserID := authDetails.GetOptionalUserID()
	if notes, err := h.NotesService.GetNotesByBookID(optionalUserID, input.BookID, input.Deleted); err != nil {
		if errors.Is(err, services.NotFoundError) {
			return nil, huma.Error404NotFound("book does not exist or you do not have access")
		} else {
			return nil, err
		}
	} else {
		return &GetNotesByBookIDOutput{
			Body: notes,
		}, nil
	}
}

func (h NotesHandler) GetNoteByID(ctx context.Context, input *GetNoteByIDInput) (*NoteOutput, error) {
	authDetails, _ := h.AuthProvider.TryGetAuthDetails(ctx)
	optionalUserID := authDetails.GetOptionalUserID()
	if note, err := h.NotesService.GetNoteByID(optionalUserID, input.NoteID); err != nil {
		if errors.Is(err, services.NotFoundError) {
			return nil, huma.Error404NotFound("note does not exist or you do not have access")
		} else {
			return nil, err
		}
	} else {
		return &NoteOutput{
			Body: note,
		}, nil
	}
}

func (h NotesHandler) GetNoteBySlug(ctx context.Context, input *GetNoteBySlugOutput) (*NoteOutput, error) {
	authDetails, _ := h.AuthProvider.TryGetAuthDetails(ctx)
	optionalUserID := authDetails.GetOptionalUserID()
	if note, err := h.NotesService.GetNoteBySlug(optionalUserID, input.Username, input.BookSlug, input.NoteSlug); err != nil {
		if errors.Is(err, services.NotFoundError) {
			return nil, huma.Error404NotFound("note does not exist or you do not have access")
		} else {
			return nil, err
		}
	} else {
		return &NoteOutput{
			Body: note,
		}, nil
	}
}

func (h NotesHandler) GetNoteContentByID(ctx context.Context, input *GetNoteContentByIDInput) (*huma.StreamResponse, error) {
	authDetails, _ := h.AuthProvider.TryGetAuthDetails(ctx)
	optionalUserID := authDetails.GetOptionalUserID()
	if checksum, stream, err := h.NotesService.GetNoteContent(optionalUserID, input.NoteID, h.Storage); err != nil {
		if errors.Is(err, services.NotFoundError) {
			return nil, huma.Error404NotFound("note does not exist or you do not have access")
		}
		return nil, err
	} else {
		if input.HasConditionalParams() {
			if err := input.PreconditionFailed(checksum, time.Now()); err != nil {
				stream.Close()
				return nil, err
			}
		}
		return &huma.StreamResponse{
			Body: func(ctx huma.Context) {
				ctx.SetHeader("Content-Type", "text/markdown")
				writer := ctx.BodyWriter()
				io.Copy(writer, stream)
				stream.Close()
			},
		}, nil
	}
}

func (h NotesHandler) PutNoteByID(ctx context.Context, input *PutNoteByIDInput) (*struct{}, error) {
	authDetails, _ := h.AuthProvider.TryGetAuthDetails(ctx)
	userID := authDetails.GetAuthenticatedUser().UserID
	if err := h.NotesService.UpdateNoteByID(userID, input.NoteID, input.Body); err != nil {
		if errors.Is(err, services.NotFoundError) {
			return nil, huma.Error404NotFound("note does not exit or you do not have access")
		} else {
			return nil, err
		}
	} else {
		return nil, nil
	}
}

func (h NotesHandler) UpdateNoteContentByID(ctx context.Context, input *UpdateNoteContentByIDInput) (*struct{}, error) {
	authDetails, _ := h.AuthProvider.TryGetAuthDetails(ctx)
	userID := authDetails.GetAuthenticatedUser().UserID
	body := bytes.NewReader(input.RawBody)
	if input.HasConditionalParams() {
		if lastModified, err := h.NotesService.GetNoteByIDLastModified(userID, input.NoteID); err != nil {
			if errors.Is(err, services.NotFoundError) {
				return nil, huma.Error404NotFound("note does not exit or you do not have access")
			} else {
				return nil, err
			}
		} else {
			if err := input.PreconditionFailed("", lastModified.Truncate(time.Second)); err != nil {
				return nil, err
			}
		}
	}
	if err := h.NotesService.UpdateNoteContentByID(
		userID,
		input.NoteID,
		body,
		h.Storage); err != nil {
		if errors.Is(err, services.NotFoundError) {
			return nil, huma.Error404NotFound("note does not exit or you do not have access")
		} else {
			return nil, err
		}
	} else {
		return nil, nil
	}
}

func (h NotesHandler) RestoreNoteByID(ctx context.Context, input *GetNoteByIDInput) (*struct{}, error) {
	authDetails, _ := h.AuthProvider.TryGetAuthDetails(ctx)
	userID := authDetails.GetAuthenticatedUser().UserID
	if err := h.NotesService.RestoreNoteByID(userID, input.NoteID); err != nil {
		if errors.Is(err, services.NotFoundError) {
			return nil, huma.Error404NotFound("note does not exist or you do not have access")
		} else {
			return nil, err
		}
	} else {
		return nil, nil
	}
}

func (h NotesHandler) DeleteNoteByID(ctx context.Context, input *DeleteNoteByIDInput) (*struct{}, error) {
	authDetails, _ := h.AuthProvider.TryGetAuthDetails(ctx)
	userID := authDetails.GetAuthenticatedUser().UserID
	if err := h.NotesService.DeleteNoteByID(
		userID,
		input.NoteID,
		input.Permanent,
		h.Storage); err != nil {
		if errors.Is(err, services.NotFoundError) {
			return nil, huma.Error404NotFound("note does not exit or you do not have access")
		} else {
			return nil, err
		}
	} else {
		return nil, nil
	}
}
