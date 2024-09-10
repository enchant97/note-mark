package handlers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/services"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

func SetupBooksHandler(g *echo.Group) {
	booksHandler := BooksHandler{}
	g.GET("/slug/@:username/books/:bookSlug", booksHandler.GetBookBySlug)
	booksRoutes := g.Group("/books")
	{
		booksRoutes.POST("", booksHandler.PostBook, authRequiredMiddleware)
		booksRoutes.GET("/:bookID", booksHandler.GetBookByID)
		booksRoutes.PATCH("/:bookID", booksHandler.PatchBookByID, authRequiredMiddleware)
		booksRoutes.DELETE("/:bookID", booksHandler.DeleteBookByID, authRequiredMiddleware)
	}
}

type BooksHandler struct {
	BooksService services.BooksService
}

func (h BooksHandler) PostBook(ctx echo.Context) error {
	authenticatedUser := getAuthDetails(ctx).GetAuthenticatedUser()
	var bookData db.CreateBook
	if err := core.BindAndValidate(ctx, &bookData); err != nil {
		return err
	}

	if book, err := h.BooksService.CreateBook(authenticatedUser.UserID, bookData); err != nil {
		return err
	} else {
		return ctx.JSON(http.StatusCreated, book)
	}
}

func (h BooksHandler) GetBookByID(ctx echo.Context) error {
	userID := getAuthDetails(ctx).GetOptionalUserID()
	bookID, err := uuid.Parse(ctx.Param("bookID"))
	if err != nil {
		return err
	}

	if book, err := h.BooksService.GetBookByID(userID, bookID); err != nil {
		if errors.Is(err, services.BooksServiceNotFoundError) {
			return ctx.NoContent(http.StatusNotFound)
		} else {
			return err
		}
	} else {
		return ctx.JSON(http.StatusOK, book)
	}
}

func (h BooksHandler) GetBookBySlug(ctx echo.Context) error {
	optionalUserID := getAuthDetails(ctx).GetOptionalUserID()
	username := ctx.Param("username")
	bookSlug := ctx.Param("bookSlug")
	includeNotes := strings.ToLower(ctx.QueryParam("include")) == "notes"

	if book, err := h.BooksService.GetBookBySlug(optionalUserID, username, bookSlug, includeNotes); err != nil {
		if errors.Is(err, services.BooksServiceNotFoundError) {
			return ctx.NoContent(http.StatusNotFound)
		} else {
			return err
		}
	} else {
		return ctx.JSON(http.StatusOK, book)
	}
}

func (h BooksHandler) PatchBookByID(ctx echo.Context) error {
	authenticatedUser := getAuthDetails(ctx).GetAuthenticatedUser()
	bookID, err := uuid.Parse(ctx.Param("bookID"))
	if err != nil {
		return err
	}
	var bookData db.UpdateBook
	if err := core.BindAndValidate(ctx, &bookData); err != nil {
		return err
	}

	if err := h.BooksService.UpdateBookByID(authenticatedUser.UserID, bookID, bookData); err != nil {
		if errors.Is(err, services.BooksServiceNotFoundError) {
			return ctx.NoContent(http.StatusNotFound)
		} else {
			return err
		}
	} else {
		return ctx.NoContent(http.StatusNoContent)
	}
}

func (h BooksHandler) DeleteBookByID(ctx echo.Context) error {
	authenticatedUser := getAuthDetails(ctx).GetAuthenticatedUser()
	bookID, err := uuid.Parse(ctx.Param("bookID"))
	if err != nil {
		return err
	}

	if err := h.BooksService.DeleteBookByID(authenticatedUser.UserID, bookID); err != nil {
		if errors.Is(err, services.BooksServiceNotFoundError) {
			return ctx.NoContent(http.StatusNotFound)
		} else {
			return err
		}
	} else {
		return ctx.NoContent(http.StatusNoContent)
	}
}
