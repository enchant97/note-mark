package routes

import (
	"net/http"

	"github.com/enchant97/note-mark/backend/db"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

func getBooksByUsername(ctx echo.Context) error {
	authenticatedUser := getAuthenticatedUser(ctx)
	username := ctx.Param("username")

	var bookOwnerID uuid.UUID
	if err := db.DB.
		First(&db.Book{}, "username = ?", username).
		Pluck("id", bookOwnerID).Error; err != nil {
		return err
	}

	var books []db.Book
	// base query
	query := db.DB.Model(&books).Where("owner_id = ?", bookOwnerID)
	if authenticatedUser.UserID != bookOwnerID {
		// restrict to only public books
		query = query.Where(bookOwnerID, "is_public = ?", true)
	}
	if err := query.Error; err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, books)
}

func getBookByID(ctx echo.Context) error {
	authenticatedUser := getAuthenticatedUser(ctx)
	bookID, err := uuid.Parse(ctx.Param("bookID"))
	if err != nil {
		return err
	}

	var book db.Book
	if err := db.DB.
		First(&book, "id = ?", bookID).
		Where("owner_id = ?", authenticatedUser.UserID).
		Or("is_public = ?", true).Error; err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, book)
}

func getBookBySlug(ctx echo.Context) error {
	authenticatedUser := getAuthenticatedUser(ctx)
	username := ctx.Param("username")
	bookSlug := ctx.Param("bookSlug")

	var bookOwnerID uuid.UUID
	if err := db.DB.
		First(&db.Book{}, "username = ?", username).
		Pluck("id", bookOwnerID).Error; err != nil {
		return err
	}

	var book db.Book
	if err := db.DB.
		First(&book, "slug = ?", bookSlug, "owner_id = ?", bookOwnerID).
		Where("owner_id = ?", authenticatedUser.UserID).
		Or("is_public = ?", true).Error; err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, book)
}
