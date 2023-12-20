package routes

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/storage"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func createNoteByBookID(ctx echo.Context) error {
	authenticatedUser := getAuthDetails(ctx).GetAuthenticatedUser()
	bookID, err := uuid.Parse(ctx.Param("bookID"))
	if err != nil {
		return err
	}
	var noteData db.CreateNote
	if err := core.BindAndValidate(ctx, &noteData); err != nil {
		return err
	}

	var count int64
	if err := db.DB.
		Model(&db.Book{}).
		Where("id = ? AND owner_id = ?", bookID, authenticatedUser.UserID).
		Limit(1).
		Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return ctx.NoContent(http.StatusNotFound)
	}

	note := noteData.IntoNote(bookID)
	if err := db.DB.Create(&note).Error; err != nil {
		return err
	}

	return ctx.JSON(http.StatusCreated, note)
}

func getNotesRecent(ctx echo.Context) error {
	userID := getAuthDetails(ctx).GetOptionalUserID()

	tx := db.DB.
		Model(&db.Note{}).
		Order("notes.updated_at DESC").
		Limit(6).
		Preload("Book", "Book.Owner").
		Joins("Book").
		Joins("Book.Owner")

	if userID == nil {
		tx = tx.Where("is_public = ?", true)
	} else {
		tx = tx.Where("owner_id = ?", userID)
	}

	recentNotes := make([]db.ValueWithSlug, 0)

	if rows, err := tx.Rows(); err != nil {
		return err
	} else {
		defer rows.Close()
		for rows.Next() {
			var row db.Note
			if err := db.DB.ScanRows(rows, &row); err != nil {
				return err
			}
			recentNotes = append(recentNotes, db.ValueWithSlug{
				Value: row,
				Slug:  fmt.Sprintf("%s/%s/%s", row.Book.Owner.Username, row.Book.Slug, row.Slug),
			})
		}
	}

	return ctx.JSON(http.StatusOK, recentNotes)
}

// TODO Can this be removed (really only need access via slug)???
func getNotesByBookID(ctx echo.Context) error {
	userID := getAuthDetails(ctx).GetOptionalUserID()
	bookID, err := uuid.Parse(ctx.Param("bookID"))
	if err != nil {
		return err
	}
	var filterParams core.NoteFilterParams
	if err := core.BindAndValidate(ctx, &filterParams); err != nil {
		return err
	}

	tx := db.DB
	if filterParams.Deleted {
		tx = tx.Unscoped()
	}
	tx = tx.
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id").
		Where(
			db.DB.Where("books.id = ?", bookID),
			db.DB.Where("owner_id = ? OR is_public = ?", userID, true),
		)
	if filterParams.Deleted {
		tx = tx.Where("notes.deleted_at IS NOT NULL")
	}
	var notes []db.Note
	if err := tx.
		Find(&notes).Error; err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, notes)
}

func getNotesBySlug(ctx echo.Context) error {
	userID := getAuthDetails(ctx).GetOptionalUserID()
	username := ctx.Param("username")
	bookSlug := ctx.Param("bookSlug")

	var bookOwner db.User
	if err := db.DB.
		Select("id").
		First(&bookOwner, "username = ?", username).Error; err != nil {
		return err
	}

	var lastModified time.Time

	if err := db.DB.
		Model(&db.Note{}).
		Joins("JOIN books ON books.id = notes.book_id").
		Where(
			db.DB.Where("books.slug = ? AND owner_id = ?", bookSlug, bookOwner.ID),
			db.DB.Where("owner_id = ? OR is_public = ?", userID, true),
		).
		Order("notes.updated_at DESC").
		Limit(1).
		Pluck("notes.updated_at", &lastModified).Error; err != nil {
		return err
	}

	if !core.HandleIfModifedSince(ctx, lastModified) {
		return ctx.NoContent(http.StatusNotModified)
	}

	var notes []db.Note
	if err := db.DB.
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id").
		Where(
			db.DB.Where("books.slug = ? AND owner_id = ?", bookSlug, bookOwner.ID),
			db.DB.Where("owner_id = ? OR is_public = ?", userID, true),
		).
		Find(&notes).Error; err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, notes)
}

func getNoteByID(ctx echo.Context) error {
	userID := getAuthDetails(ctx).GetOptionalUserID()
	noteID, err := uuid.Parse(ctx.Param("noteID"))
	if err != nil {
		return err
	}

	var note db.Note
	if err := db.DB.
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id").
		Where("owner_id = ? OR is_public = ?", userID, true).
		First(&note, "notes.id = ?", noteID).Error; err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, note)
}

func getNoteBySlug(ctx echo.Context) error {
	userID := getAuthDetails(ctx).GetOptionalUserID()
	username := ctx.Param("username")
	bookSlug := ctx.Param("bookSlug")
	noteSlug := ctx.Param("noteSlug")

	var bookOwner db.User
	if err := db.DB.
		Select("id").
		First(&bookOwner, "username = ?", username).Error; err != nil {
		return err
	}

	var note db.Note
	if err := db.DB.
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id").
		Where("books.slug = ? AND books.owner_id = ?", bookSlug, bookOwner.ID).
		Where("owner_id = ? OR is_public = ?", userID, true).
		First(&note, "notes.slug = ?", noteSlug).Error; err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, note)
}

func getNoteContent(ctx echo.Context) error {
	userID := getAuthDetails(ctx).GetOptionalUserID()
	noteID, err := uuid.Parse(ctx.Param("noteID"))
	if err != nil {
		return err
	}

	var count int64
	if err := db.DB.
		Model(&db.Note{}).
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id").
		Where("owner_id = ? OR is_public = ?", userID, true).
		Where("notes.id = ?", noteID).
		Limit(1).
		Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return ctx.NoContent(http.StatusNotFound)
	}

	storage_backend := ctx.Get("Storage").(storage.StorageController)

	if currentETag, err := storage_backend.ReadNoteChecksum(noteID); err != nil {
		if !errors.Is(err, storage.ErrNotFound) {
			return err
		}
	} else if needNewContent := core.HandleETag(ctx, currentETag); !needNewContent {
		return ctx.NoContent(http.StatusNotModified)
	}

	if stream, err := storage_backend.ReadNote(noteID); err != nil {
		if errors.Is(err, storage.ErrNotFound) {
			return ctx.Blob(http.StatusOK, "text/markdown", []byte("\n"))
		}
		return err
	} else {
		defer stream.Close()
		return ctx.Stream(http.StatusOK, "text/markdown", stream)
	}
}

func patchNoteByID(ctx echo.Context) error {
	authenticatedUser := getAuthDetails(ctx).GetAuthenticatedUser()
	noteID, err := uuid.Parse(ctx.Param("noteID"))
	if err != nil {
		return err
	}
	var noteData db.UpdateNote
	if err := core.BindAndValidate(ctx, &noteData); err != nil {
		return err
	}

	// INFO this other query is required as joins don't work when updating
	var count int64
	if err := db.DB.
		Model(&db.Note{}).
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id").
		Where("owner_id = ? AND notes.id = ?", authenticatedUser.UserID, noteID).
		Limit(1).
		Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return ctx.NoContent(http.StatusNotFound)
	}

	result := db.DB.
		Model(&db.Note{}).
		Where("notes.id = ?", noteID).
		Updates(noteData)
	if err := result.Error; err != nil {
		return err
	}
	if result.RowsAffected == 0 {
		return ctx.NoContent(http.StatusNotFound)
	}

	return ctx.NoContent(http.StatusNoContent)
}

func updateNoteContent(ctx echo.Context) error {
	authenticatedUser := getAuthDetails(ctx).GetAuthenticatedUser()
	noteID, err := uuid.Parse(ctx.Param("noteID"))
	if err != nil {
		return err
	}

	var count int64
	if err := db.DB.
		Model(&db.Note{}).
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id").
		Where("owner_id = ? AND notes.id = ?", authenticatedUser.UserID, noteID).
		Limit(1).
		Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return ctx.NoContent(http.StatusNotFound)
	}

	storage_backend := ctx.Get("Storage").(storage.StorageController)

	// put note saving in transaction so db changes can rollback automatically if read/write fails
	if err := db.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.
			Model(&db.Note{}).
			Where("id = ?", noteID).
			Update("UpdatedAt", db.DB.NowFunc()).
			Error; err != nil {
			return err
		}
		body := ctx.Request().Body
		defer body.Close()
		if err := storage_backend.WriteNote(noteID, body); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return err
	}

	return ctx.NoContent(http.StatusNoContent)
}

func restoreNoteByID(ctx echo.Context) error {
	authenticatedUser := getAuthDetails(ctx).GetAuthenticatedUser()
	noteID, err := uuid.Parse(ctx.Param("noteID"))
	if err != nil {
		return err
	}

	var note db.Note
	if err := db.DB.
		Unscoped().
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id").
		Where("owner_id = ?", authenticatedUser.UserID).
		Select("notes.id", "book_id").
		First(&note, "notes.id = ?", noteID).Error; err != nil {
		return err
	}

	if err := db.DB.Transaction(func(tx *gorm.DB) error {
		// restore note
		if err := tx.Unscoped().
			Model(&db.Note{}).
			Where("id = ?", note.ID).
			Update("deleted_at", nil).
			Error; err != nil {
			return err
		}
		// restore book (ensuring user can visit restored note)
		if err := tx.Unscoped().
			Model(&db.Book{}).
			Where("id = ?", note.BookID).
			Update("deleted_at", nil).
			Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		return err
	}

	return ctx.NoContent(http.StatusNoContent)
}

func deleteNoteById(ctx echo.Context) error {
	authenticatedUser := getAuthDetails(ctx).GetAuthenticatedUser()
	noteID, err := uuid.Parse(ctx.Param("noteID"))
	if err != nil {
		return err
	}

	var params core.DeleteParams
	if err := core.BindAndValidate(ctx, &params); err != nil {
		return err
	}

	// INFO this other query is required as joins don't work when deleting
	var count int64
	if err := db.DB.
		Unscoped().
		Model(&db.Note{}).
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id").
		Where("owner_id = ? AND notes.id = ?", authenticatedUser.UserID, noteID).
		Limit(1).
		Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return ctx.NoContent(http.StatusNotFound)
	}

	if params.Permanent {
		// performs hard deletion
		storage_backend := ctx.Get("Storage").(storage.StorageController)
		if err := db.DB.Transaction(func(tx *gorm.DB) error {
			if err := tx.Unscoped().Delete(&db.Note{}, "id = ?", noteID).Error; err != nil {
				return err
			}
			if err := storage_backend.DeleteNote(noteID); err != nil {
				return err
			}
			return nil
		}); err != nil {
			return err
		}
	} else {
		// performs soft deletion
		if err := db.DB.Delete(&db.Note{}, "id = ?", noteID).Error; err != nil {
			return err
		}
	}

	return ctx.NoContent(http.StatusNoContent)
}
