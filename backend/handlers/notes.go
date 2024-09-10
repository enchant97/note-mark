package handlers

import (
	"errors"
	"net/http"

	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/services"
	"github.com/enchant97/note-mark/backend/storage"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type NotesHandler struct {
	services.NotesService
	Storage storage.StorageController
}

func (h NotesHandler) PostNoteByBookID(ctx echo.Context) error {
	authenticatedUser := getAuthDetails(ctx).GetAuthenticatedUser()
	bookID, err := uuid.Parse(ctx.Param("bookID"))
	if err != nil {
		return err
	}
	var noteData db.CreateNote
	if err := core.BindAndValidate(ctx, &noteData); err != nil {
		return err
	}

	if note, err := h.NotesService.CreateNote(authenticatedUser.UserID, bookID, noteData); err != nil {
		return err
	} else {
		return ctx.JSON(http.StatusCreated, note)
	}
}

func (h NotesHandler) GetNotesRecent(ctx echo.Context) error {
	optionalUserID := getAuthDetails(ctx).GetOptionalUserID()

	if recent, err := h.NotesService.GetRecentNotes(optionalUserID); err != nil {
		return err
	} else {
		return ctx.JSON(http.StatusOK, recent)
	}
}

func (h NotesHandler) GetNotesByBookID(ctx echo.Context) error {
	optionalUserID := getAuthDetails(ctx).GetOptionalUserID()
	bookID, err := uuid.Parse(ctx.Param("bookID"))
	if err != nil {
		return err
	}
	var filterParams core.NoteFilterParams
	if err := core.BindAndValidate(ctx, &filterParams); err != nil {
		return err
	}

	if notes, err := h.NotesService.GetNotesByBookID(optionalUserID, bookID, filterParams); err != nil {
		return err
	} else {
		return ctx.JSON(http.StatusOK, notes)
	}
}

func (h NotesHandler) GetNoteByID(ctx echo.Context) error {
	optionalUserID := getAuthDetails(ctx).GetOptionalUserID()
	noteID, err := uuid.Parse(ctx.Param("noteID"))
	if err != nil {
		return err
	}

	if note, err := h.NotesService.GetNoteByID(optionalUserID, noteID); err != nil {
		return err
	} else {

		return ctx.JSON(http.StatusOK, note)
	}
}

func (h NotesHandler) GetNoteBySlug(ctx echo.Context) error {
	optionalUserID := getAuthDetails(ctx).GetOptionalUserID()
	username := ctx.Param("username")
	bookSlug := ctx.Param("bookSlug")
	noteSlug := ctx.Param("noteSlug")

	if note, err := h.NotesService.GetNoteBySlug(optionalUserID, username, bookSlug, noteSlug); err != nil {
		return err
	} else {
		return ctx.JSON(http.StatusOK, note)
	}
}

func (h NotesHandler) GetNoteContentByID(ctx echo.Context) error {
	optionalUserID := getAuthDetails(ctx).GetOptionalUserID()
	noteID, err := uuid.Parse(ctx.Param("noteID"))
	if err != nil {
		return err
	}

	if checksum, stream, err := h.NotesService.GetNoteContent(optionalUserID, noteID, h.Storage); err != nil {
		if errors.Is(err, services.NoteServiceNotFoundError) {
			return ctx.NoContent(http.StatusNotFound)
		}
		return err
	} else {
		defer stream.Close()
		if checksum != "" && !core.HandleETag(ctx, checksum) {
			return ctx.NoContent(http.StatusNotModified)
		} else {
			return ctx.Stream(http.StatusOK, "text/markdown", stream)
		}
	}
}

func (h NotesHandler) PatchNoteByID(ctx echo.Context) error {
	authenticatedUser := getAuthDetails(ctx).GetAuthenticatedUser()
	noteID, err := uuid.Parse(ctx.Param("noteID"))
	if err != nil {
		return err
	}
	var noteData db.UpdateNote
	if err := core.BindAndValidate(ctx, &noteData); err != nil {
		return err
	}

	if err := h.NotesService.UpdateNoteByID(authenticatedUser.UserID, noteID, noteData); err != nil {
		if errors.Is(err, services.NoteServiceNotFoundError) {
			return ctx.NoContent(http.StatusNotFound)
		} else {
			return err
		}
	} else {
		return ctx.NoContent(http.StatusNoContent)
	}
}

func (h NotesHandler) UpdateNoteContentByID(ctx echo.Context) error {
	authenticatedUser := getAuthDetails(ctx).GetAuthenticatedUser()
	noteID, err := uuid.Parse(ctx.Param("noteID"))
	if err != nil {
		return err
	}

	body := ctx.Request().Body
	defer body.Close()

	if err := h.NotesService.UpdateNoteContentByID(
		authenticatedUser.UserID,
		noteID,
		body,
		h.Storage); err != nil {
		if errors.Is(err, services.NoteServiceNotFoundError) {
			return ctx.NoContent(http.StatusNotFound)
		} else {
			return err
		}
	} else {
		return ctx.NoContent(http.StatusNoContent)
	}
}

func (h NotesHandler) RestoreNoteByID(ctx echo.Context) error {
	authenticatedUser := getAuthDetails(ctx).GetAuthenticatedUser()
	noteID, err := uuid.Parse(ctx.Param("noteID"))
	if err != nil {
		return err
	}

	if err := h.NotesService.RestoreNoteByID(authenticatedUser.UserID, noteID); err != nil {
		return err
	} else {
		return ctx.NoContent(http.StatusNoContent)
	}
}

func (h NotesHandler) DeleteNoteByID(ctx echo.Context) error {
	authenticatedUser := getAuthDetails(ctx).GetAuthenticatedUser()
	noteID, err := uuid.Parse(ctx.Param("noteID"))
	if err != nil {
		return err
	}

	var params core.DeleteParams
	if err := core.BindAndValidate(ctx, &params); err != nil {
		return err
	}

	if err := h.NotesService.DeleteNoteByID(
		authenticatedUser.UserID,
		noteID,
		params.Permanent,
		h.Storage); err != nil {
		if errors.Is(err, services.NoteServiceNotFoundError) {
			return ctx.NoContent(http.StatusNotFound)
		} else {
			return err
		}
	} else {
		return ctx.NoContent(http.StatusNoContent)
	}
}
