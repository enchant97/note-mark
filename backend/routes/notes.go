package routes

import (
	"net/http"

	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

func createNote(ctx echo.Context) error {
	authenticatedUser := getAuthenticatedUser(ctx)
	var noteData db.CreateNote
	if err := core.BindAndValidate(ctx, &noteData); err != nil {
		return err
	}

	// TODO can this be made more effient?
	if err := db.DB.
		First(&db.Book{}, "owner_id = ?", authenticatedUser.UserID).
		Error; err != nil {
		return err
	}

	note := noteData.IntoNote()
	if err := db.DB.Create(&note).Error; err != nil {
		return err
	}

	return ctx.JSON(http.StatusCreated, note)
}

func getNotesByBookID(ctx echo.Context) error {
	authenticatedUser := getAuthenticatedUser(ctx)
	bookID, err := uuid.Parse(ctx.Param("bookID"))
	if err != nil {
		return err
	}

	var notes []db.Note
	if err := db.DB.
		First(&db.Book{}, "id = ?", bookID).
		Where("owner_id = ?", authenticatedUser.UserID).
		Or("is_public = ?", true).
		Association("Notes").
		Find(&notes); err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, notes)
}

func getNotesBySlug(ctx echo.Context) error {
	authenticatedUser := getAuthenticatedUser(ctx)
	username := ctx.Param("username")
	bookSlug := ctx.Param("bookSlug")

	var bookOwner db.User
	if err := db.DB.
		First(&bookOwner, "username = ?", username).
		Select("id").Error; err != nil {
		return err
	}

	var notes []db.Note
	if err := db.DB.
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id").
		Where(
			db.DB.Where("books.slug = ? AND owner_id = ?", bookSlug, bookOwner.ID),
			db.DB.Where("owner_id = ? OR is_public = ?", authenticatedUser.UserID, true),
		).
		Find(&notes).Error; err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, notes)
}

func getNoteByID(ctx echo.Context) error {
	authenticatedUser := getAuthenticatedUser(ctx)
	noteID, err := uuid.Parse(ctx.Param("noteID"))
	if err != nil {
		return err
	}

	var note db.Note
	if err := db.DB.Model(&db.User{}).
		Where("owner_id = ?", authenticatedUser.UserID).
		Or("is_public = ?", true).Association("Notes").
		Find(&note, "note_id = ?", noteID); err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, note)
}

func getNoteBySlug(ctx echo.Context) error {
	authenticatedUser := getAuthenticatedUser(ctx)
	username := ctx.Param("username")
	bookSlug := ctx.Param("bookSlug")
	noteSlug := ctx.Param("noteSlug")

	var bookOwner db.User
	if err := db.DB.
		First(&bookOwner, "username = ?", username).
		Select("id").Error; err != nil {
		return err
	}

	var note db.Note
	if err := db.DB.
		First(&db.Book{}, "slug = ?", bookSlug, "owner_id = ?", bookOwner.ID).
		Where("owner_id = ?", authenticatedUser.UserID).
		Or("is_public = ?", true).Association("Notes").
		Find(&note, "slug = ?", noteSlug); err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, note)
}
