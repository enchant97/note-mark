package handlers

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/middleware"
	"github.com/enchant97/note-mark/backend/services"
	"github.com/google/uuid"
)

func SetupBooksHandler(
	api huma.API,
	authProvider middleware.AuthDetailsProvider,
) {
	booksHandler := BooksHandler{}
	huma.Register(api, huma.Operation{
		Method:        http.MethodPost,
		Path:          "/api/books",
		Middlewares:   huma.Middlewares{authProvider.AuthRequiredMiddleware},
		DefaultStatus: http.StatusCreated,
	}, booksHandler.PostBook)
	huma.Get(api, "/api/books/{bookID}", booksHandler.GetBookByID)
	huma.Get(api, "/api/slug/{username}/books/{bookSlug}", booksHandler.GetBookBySlug)
	huma.Register(api, huma.Operation{
		Method:      http.MethodPut,
		Path:        "/api/books/{bookID}",
		Middlewares: huma.Middlewares{authProvider.AuthRequiredMiddleware},
	}, booksHandler.PutBookByID)
	huma.Register(api, huma.Operation{
		Method:      http.MethodDelete,
		Path:        "/api/books/{bookID}",
		Middlewares: huma.Middlewares{authProvider.AuthRequiredMiddleware},
	}, booksHandler.DeleteBookByID)
}

type PostBookInput struct {
	Body db.CreateBook
}

type BookOutput struct {
	Body db.Book
}

type GetBookByIDInput struct {
	BookID uuid.UUID `path:"bookID" format:"uuid"`
}

type GetBookBySlugInput struct {
	Username string `path:"username"`
	BookSlug string `path:"bookSlug"`
	Include  string `query:"include" enum:"notes"`
}

type PutBookByIDInput struct {
	BookID uuid.UUID `path:"bookID" format:"uuid"`
	Body   db.UpdateBook
}

type DeleteBookByIDInput struct {
	BookID uuid.UUID `path:"bookID" format:"uuid"`
}

type BooksHandler struct {
	BooksService services.BooksService
	AuthProvider middleware.AuthDetailsProvider
}

func (h BooksHandler) PostBook(ctx context.Context, input *PostBookInput) (*BookOutput, error) {
	authDetails, _ := h.AuthProvider.TryGetAuthDetails(ctx)
	userID := authDetails.GetAuthenticatedUser().UserID
	if book, err := h.BooksService.CreateBook(userID, input.Body); err != nil {
		if errors.Is(err, services.NotFoundError) {
			return nil, huma.Error404NotFound("book does not exist or you do not have access")
		} else if errors.Is(err, services.ConflictError) {
			return nil, huma.Error409Conflict("book with that slug already exists")
		} else {
			return nil, err
		}
	} else {
		return &BookOutput{
			Body: book,
		}, nil
	}
}

func (h BooksHandler) GetBookByID(ctx context.Context, input *GetBookByIDInput) (*BookOutput, error) {
	authDetails, _ := h.AuthProvider.TryGetAuthDetails(ctx)
	optionalUserID := authDetails.GetOptionalUserID()
	if book, err := h.BooksService.GetBookByID(optionalUserID, input.BookID); err != nil {
		if errors.Is(err, services.NotFoundError) {
			return nil, huma.Error404NotFound("book does not exist or you do not have access")
		} else {
			return nil, err
		}
	} else {
		return &BookOutput{
			Body: book,
		}, nil
	}
}

func (h BooksHandler) GetBookBySlug(ctx context.Context, input *GetBookBySlugInput) (*BookOutput, error) {
	authDetails, _ := h.AuthProvider.TryGetAuthDetails(ctx)
	optionalUserID := authDetails.GetOptionalUserID()
	if book, err := h.BooksService.GetBookBySlug(
		optionalUserID,
		input.Username,
		input.BookSlug,
		input.Include == "notes",
	); err != nil {
		if errors.Is(err, services.NotFoundError) {
			return nil, huma.Error404NotFound("book does not exist or you do not have access")
		} else {
			return nil, err
		}
	} else {
		return &BookOutput{
			Body: book,
		}, nil
	}
}

func (h BooksHandler) PutBookByID(ctx context.Context, input *PutBookByIDInput) (*struct{}, error) {
	authDetails, _ := h.AuthProvider.TryGetAuthDetails(ctx)
	userID := authDetails.GetAuthenticatedUser().UserID
	if err := h.BooksService.UpdateBookByID(userID, input.BookID, input.Body); err != nil {
		if errors.Is(err, services.NotFoundError) {
			return nil, huma.Error404NotFound("book does not exist or you do not have access")
		} else {
			return nil, err
		}
	} else {
		return nil, nil
	}
}

func (h BooksHandler) DeleteBookByID(ctx context.Context, input *DeleteBookByIDInput) (*struct{}, error) {
	authDetails, _ := h.AuthProvider.TryGetAuthDetails(ctx)
	userID := authDetails.GetAuthenticatedUser().UserID
	if err := h.BooksService.DeleteBookByID(userID, input.BookID); err != nil {
		if errors.Is(err, services.NotFoundError) {
			return nil, huma.Error404NotFound("book does not exist or you do not have access")
		} else {
			return nil, err
		}
	} else {
		return nil, nil
	}
}
