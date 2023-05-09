package routes

import (
	"net/http"

	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

func createBook(ctx echo.Context) error {
	authenticatedUser := getAuthenticatedUser(ctx)
	var bookData db.CreateBook
	if err := core.BindAndValidate(ctx, &bookData); err != nil {
		return err
	}

	book := bookData.IntoBook(authenticatedUser.UserID)
	if err := db.DB.Create(&book).Error; err != nil {
		return err
	}

	return ctx.JSON(http.StatusCreated, book)
}

func getBooksByUsername(ctx echo.Context) error {
	authenticatedUser := getAuthenticatedUser(ctx)
	username := ctx.Param("username")

	var bookOwner db.User
	if err := db.DB.
		Select("id").
		First(&bookOwner, "username = ?", username).
		Error; err != nil {
		return err
	}

	var books []db.Book
	// base query
	query := db.DB.Where("owner_id = ?", bookOwner.ID)
	if authenticatedUser.UserID != bookOwner.ID {
		// restrict to only public books
		query = query.Where("is_public = ?", true)
	}
	if err := query.Find(&books).Error; err != nil {
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
		Where("owner_id = ?", authenticatedUser.UserID).
		Or("is_public = ?", true).
		First(&book, "id = ?", bookID).
		Error; err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, book)
}

func getBookBySlug(ctx echo.Context) error {
	authenticatedUser := getAuthenticatedUser(ctx)
	username := ctx.Param("username")
	bookSlug := ctx.Param("bookSlug")

	var bookOwner db.User
	if err := db.DB.
		Select("id").
		First(&bookOwner, "username = ?", username).
		Error; err != nil {
		return err
	}

	var book db.Book
	if err := db.DB.
		Where("owner_id = ?", authenticatedUser.UserID).
		Or("is_public = ?", true).
		First(&book, "slug = ?", bookSlug, "owner_id = ?", bookOwner.ID).
		Error; err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, book)
}