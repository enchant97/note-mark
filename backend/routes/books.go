package routes

import (
	"net/http"
	"time"

	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

func createBook(ctx echo.Context) error {
	authenticatedUser := getAuthDetails(ctx).GetAuthenticatedUser()
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
	userID := getAuthDetails(ctx).GetOptionalUserID()
	username := ctx.Param("username")

	var bookOwner db.User
	if err := db.DB.
		Select("id").
		First(&bookOwner, "username = ?", username).
		Error; err != nil {
		return err
	}

	var lastModified time.Time

	if err := db.DB.Model(&db.Book{}).
		Where(
			db.DB.Where("owner_id = ?", bookOwner.ID),
			db.DB.Where("owner_id = ? OR is_public = ?", userID, true),
		).
		Order("updated_at DESC").Limit(1).Pluck("updated_at", &lastModified).Error; err != nil {
		return err
	}

	if !core.HandleIfModifedSince(ctx, lastModified) {
		return ctx.NoContent(http.StatusNotModified)
	}

	var books []db.Book
	if err := db.DB.
		Where(
			db.DB.Where("owner_id = ?", bookOwner.ID),
			db.DB.Where("owner_id = ? OR is_public = ?", userID, true),
		).
		Find(&books).
		Error; err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, books)
}

func getBookByID(ctx echo.Context) error {
	userID := getAuthDetails(ctx).GetOptionalUserID()
	bookID, err := uuid.Parse(ctx.Param("bookID"))
	if err != nil {
		return err
	}

	var book db.Book
	if err := db.DB.
		Where("owner_id = ? OR is_public = ?", userID, true).
		First(&book, "id = ?", bookID).
		Error; err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, book)
}

func getBookBySlug(ctx echo.Context) error {
	userID := getAuthDetails(ctx).GetOptionalUserID()
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
		Where("owner_id = ? OR is_public = ?", userID, true).
		First(&book, "slug = ? AND owner_id = ?", bookSlug, bookOwner.ID).
		Error; err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, book)
}

func patchBookByID(ctx echo.Context) error {
	authenticatedUser := getAuthDetails(ctx).GetAuthenticatedUser()
	bookID, err := uuid.Parse(ctx.Param("bookID"))
	if err != nil {
		return err
	}
	var bookData db.UpdateBook
	if err := core.BindAndValidate(ctx, &bookData); err != nil {
		return err
	}

	result := db.DB.
		Model(&db.Book{}).
		Where("id = ? AND owner_id = ?", bookID, authenticatedUser.UserID).
		Updates(bookData)
	if err := result.Error; err != nil {
		return err
	}
	if result.RowsAffected == 0 {
		return ctx.NoContent(http.StatusNotFound)
	}

	return ctx.NoContent(http.StatusNoContent)
}

func deleteBookByID(ctx echo.Context) error {
	authenticatedUser := getAuthDetails(ctx).GetAuthenticatedUser()
	bookID, err := uuid.Parse(ctx.Param("bookID"))
	if err != nil {
		return err
	}

	result := db.DB.
		Where("id = ? AND owner_id = ?", bookID, authenticatedUser.UserID).
		Delete(&db.Book{})
	if err := result.Error; err != nil {
		return err
	}
	if result.RowsAffected == 0 {
		return ctx.NoContent(http.StatusNotFound)
	}

	return ctx.NoContent(http.StatusNoContent)
}
