package services

import (
	"errors"

	"github.com/enchant97/note-mark/backend/db"
	"github.com/google/uuid"
)

var BooksServiceNotFoundError = errors.New("not found")

type BooksService struct{}

func (s BooksService) CreateBook(userID uuid.UUID, toCreate db.CreateBook) (db.Book, error) {
	book := toCreate.IntoBook(userID)
	return book, db.DB.Create(&book).Error
}

func (s BooksService) GetBookByID(currentUserID *uuid.UUID, bookID uuid.UUID) (db.Book, error) {
	var book db.Book
	return book, db.DB.
		Where("owner_id = ? OR is_public = ?", currentUserID, true).
		First(&book, "id = ?", bookID).
		Error
}

func (s BooksService) GetBookBySlug(
	currentUserID *uuid.UUID,
	username string,
	bookSlug string,
	includeNotes bool) (db.Book, error) {
	var bookOwner db.User
	if err := db.DB.
		Select("id").
		First(&bookOwner, "username = ?", username).
		Error; err != nil {
		return db.Book{}, err
	}

	query := db.DB
	if includeNotes {
		query = query.Preload("Notes")
	}
	var book db.Book
	return book, query.
		Where("owner_id = ? OR is_public = ?", currentUserID, true).
		First(&book, "slug = ? AND owner_id = ?", bookSlug, bookOwner.ID).
		Error
}

func (s BooksService) UpdateBookByID(
	currentUserID uuid.UUID,
	bookID uuid.UUID,
	input db.UpdateBook) error {
	result := db.DB.
		Model(&db.Book{}).
		Where("id = ? AND owner_id = ?", bookID, currentUserID).
		Updates(input)
	if err := result.Error; err != nil {
		return err
	}
	if result.RowsAffected == 0 {
		return BooksServiceNotFoundError
	}
	return nil
}

func (s BooksService) DeleteBookByID(currentUserID uuid.UUID, bookID uuid.UUID) error {
	result := db.DB.
		Where("id = ? AND owner_id = ?", bookID, currentUserID).
		Delete(&db.Book{})
	if err := result.Error; err != nil {
		return err
	}
	if result.RowsAffected == 0 {
		return BooksServiceNotFoundError
	}
	return nil
}
