package services

import (
	"errors"
	"fmt"
	"io"
	"strings"

	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/storage"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var NoteServiceNotFoundError = errors.New("not found")

type NotesService struct{}

func (s NotesService) CreateNote(
	userID uuid.UUID,
	bookID uuid.UUID,
	toCreate db.CreateNote) (db.Note, error) {
	var count int64
	if err := db.DB.
		Model(&db.Book{}).
		Where("id = ? AND owner_id = ?", bookID, userID).
		Limit(1).
		Count(&count).Error; err != nil {
		return db.Note{}, err
	}
	if count == 0 {
		return db.Note{}, NoteServiceNotFoundError
	}
	note := toCreate.IntoNote(bookID)
	return note, db.DB.Create(&note).Error
}

func (s NotesService) GetRecentNotes(currentUserID *uuid.UUID) ([]db.ValueWithSlug, error) {
	tx := db.DB.
		Model(&db.Note{}).
		Order("notes.updated_at DESC").
		Limit(6).
		Preload("Book", "Book.Owner").
		Joins("Book").
		Joins("Book.Owner")

	if currentUserID == nil {
		tx = tx.Where("is_public = ?", true)
	} else {
		tx = tx.Where("owner_id = ?", currentUserID)
	}

	recentNotes := make([]db.ValueWithSlug, 0)

	if rows, err := tx.Rows(); err != nil {
		return nil, err
	} else {
		defer rows.Close()
		for rows.Next() {
			var row db.Note
			if err := db.DB.ScanRows(rows, &row); err != nil {
				return nil, err
			}
			recentNotes = append(recentNotes, db.ValueWithSlug{
				Value: row,
				Slug:  fmt.Sprintf("%s/%s/%s", row.Book.Owner.Username, row.Book.Slug, row.Slug),
			})
		}
	}
	return recentNotes, nil
}

func (s NotesService) GetNotesByBookID(currentUserID *uuid.UUID, bookID uuid.UUID, filters core.NoteFilterParams) ([]db.Note, error) {
	tx := db.DB
	if filters.Deleted {
		tx = tx.Unscoped()
	}
	tx = tx.
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id").
		Where(
			db.DB.Where("books.id = ?", bookID),
			db.DB.Where("owner_id = ? OR is_public = ?", currentUserID, true),
		)
	if filters.Deleted {
		tx = tx.Where("notes.deleted_at IS NOT NULL")
	}
	var notes []db.Note
	return notes, tx.Find(&notes).Error
}

func (s NotesService) GetNoteByID(currentUserID *uuid.UUID, noteID uuid.UUID) (db.Note, error) {
	var note db.Note
	return note, db.DB.
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id").
		Where("owner_id = ? OR is_public = ?", currentUserID, true).
		First(&note, "notes.id = ?", noteID).Error
}

func (s NotesService) GetNoteBySlug(
	currentUserID *uuid.UUID,
	username string,
	bookSlug string,
	noteSlug string) (db.Note, error) {
	var bookOwner db.User
	if err := db.DB.
		Select("id").
		First(&bookOwner, "username = ?", username).Error; err != nil {
		return db.Note{}, err
	}
	var note db.Note
	return note, db.DB.
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id").
		Where("books.slug = ? AND books.owner_id = ?", bookSlug, bookOwner.ID).
		Where("owner_id = ? OR is_public = ?", currentUserID, true).
		First(&note, "notes.slug = ?", noteSlug).Error
}

func (s NotesService) GetNoteContent(
	currentUserID *uuid.UUID,
	noteID uuid.UUID,
	storage_backend storage.StorageController) (string, io.ReadCloser, error) {
	var count int64
	if err := db.DB.
		Model(&db.Note{}).
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id").
		Where("owner_id = ? OR is_public = ?", currentUserID, true).
		Where("notes.id = ?", noteID).
		Limit(1).
		Count(&count).Error; err != nil {
		return "", nil, err
	}
	if count == 0 {
		return "", nil, NoteServiceNotFoundError
	}

	checksum, err := storage_backend.ReadNoteChecksum(noteID)
	if err != nil && !errors.Is(err, storage.ErrNotFound) {
		return "", nil, err
	}
	stream, err := storage_backend.ReadNote(noteID)
	if err != nil && errors.Is(err, storage.ErrNotFound) {
		return "", io.NopCloser(strings.NewReader("\n")), nil
	}
	return checksum, stream, err
}

func (s NotesService) UpdateNoteByID(
	currentUserID uuid.UUID,
	noteID uuid.UUID,
	input db.UpdateNote) error {
	// INFO this other query is required as joins don't work when updating
	var count int64
	if err := db.DB.
		Model(&db.Note{}).
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id").
		Where("owner_id = ? AND notes.id = ?", currentUserID, noteID).
		Limit(1).
		Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return NoteServiceNotFoundError
	}

	result := db.DB.
		Model(&db.Note{}).
		Where("notes.id = ?", noteID).
		Updates(input)
	if err := result.Error; err != nil {
		return err
	}
	if result.RowsAffected == 0 {
		return NoteServiceNotFoundError
	}
	return nil
}

func (s NotesService) UpdateNoteContentByID(
	currentUserID uuid.UUID,
	noteID uuid.UUID,
	content io.Reader,
	storage_backend storage.StorageController) error {
	var count int64
	if err := db.DB.
		Model(&db.Note{}).
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id").
		Where("owner_id = ? AND notes.id = ?", currentUserID, noteID).
		Limit(1).
		Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return NoteServiceNotFoundError
	}

	// put note saving in transaction so db changes can rollback automatically if read/write fails
	return db.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.
			Model(&db.Note{}).
			Where("id = ?", noteID).
			Update("UpdatedAt", db.DB.NowFunc()).
			Error; err != nil {
			return err
		}
		if err := storage_backend.WriteNote(noteID, content); err != nil {
			return err
		}
		return nil
	})
}

func (s NotesService) RestoreNoteByID(currentUserID uuid.UUID, noteID uuid.UUID) error {
	var note db.Note
	if err := db.DB.
		Unscoped().
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id").
		Where("owner_id = ?", currentUserID).
		Select("notes.id", "book_id").
		First(&note, "notes.id = ?", noteID).Error; err != nil {
		return err
	}

	return db.DB.Transaction(func(tx *gorm.DB) error {
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
	})
}

func (s NotesService) DeleteNoteByID(
	currentUserID uuid.UUID,
	noteID uuid.UUID,
	permanent bool,
	storage_backend storage.StorageController) error {
	// INFO this other query is required as joins don't work when deleting
	var count int64
	if err := db.DB.
		Unscoped().
		Model(&db.Note{}).
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id").
		Where("owner_id = ? AND notes.id = ?", currentUserID, noteID).
		Limit(1).
		Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return NoteServiceNotFoundError
	}

	if permanent {
		// performs hard deletion
		return db.DB.Transaction(func(tx *gorm.DB) error {
			if err := tx.Unscoped().Delete(&db.NoteAsset{}, "note_id = ?", noteID).Error; err != nil {
				return err
			}
			if err := tx.Unscoped().Delete(&db.Note{}, "id = ?", noteID).Error; err != nil {
				return err
			}
			if err := storage_backend.DeleteNote(noteID); err != nil {
				return err
			}
			return nil
		})
	} else {
		// performs soft deletion
		return db.DB.Delete(&db.Note{}, "id = ?", noteID).Error
	}
}
