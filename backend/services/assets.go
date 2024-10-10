package services

import (
	"io"

	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/storage"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type StoredAsset struct {
	db.NoteAsset
	Info storage.AssetFileInfo `json:"info"`
}

type AssetsService struct{}

func (s AssetsService) CreateNoteAsset(
	userID uuid.UUID,
	noteID uuid.UUID,
	name string,
	content io.Reader,
	storage storage.StorageController) (StoredAsset, error) {
	var count int64
	if err := db.DB.
		Model(&db.Note{}).
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id").
		Where("owner_id = ? AND notes.id = ?", userID, noteID).
		Limit(1).
		Count(&count).Error; err != nil {
		return StoredAsset{}, err
	}
	if count == 0 {
		return StoredAsset{}, NotFoundError
	}

	noteAsset := db.NoteAsset{
		NoteID: noteID,
		Name:   name,
	}

	if err := db.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&noteAsset).Error; err != nil {
			return err
		}
		return storage.WriteNoteAsset(noteID, noteAsset.ID, content)
	}); err != nil {
		return StoredAsset{}, err
	}

	if info, err := storage.GetNoteAssetInfo(noteID, noteAsset.ID); err != nil {
		return StoredAsset{}, err
	} else {
		return StoredAsset{
			NoteAsset: noteAsset,
			Info:      info,
		}, nil
	}
}

func (s AssetsService) GetNoteAssets(
	userID *uuid.UUID,
	noteID uuid.UUID,
	storage storage.StorageController) ([]StoredAsset, error) {
	var noteAssets []db.NoteAsset
	storedAssets := make([]StoredAsset, 0)

	if err := db.DB.
		Preload("Note.Book").
		Joins("JOIN notes ON notes.id = note_assets.note_id").
		Joins("JOIN books ON books.id = notes.book_id").
		Where(
			db.DB.Where("books.owner_id = ? OR books.is_public = ?", userID, true),
			db.DB.Where("notes.id = ?", noteID),
		).
		Find(&noteAssets).
		Error; err != nil {
		return storedAssets, err
	}

	for _, noteAsset := range noteAssets {
		if info, err := storage.GetNoteAssetInfo(noteID, noteAsset.ID); err != nil {
			return storedAssets, err
		} else {
			storedAssets = append(storedAssets, StoredAsset{
				NoteAsset: noteAsset,
				Info:      info,
			})
		}
	}
	return storedAssets, nil
}

func (s AssetsService) GetNoteAssetContentByID(
	noteID uuid.UUID,
	assetID uuid.UUID,
	storage_backend storage.StorageController) (db.NoteAsset, storage.AssetFileInfo, io.ReadCloser, error) {
	var noteAsset db.NoteAsset

	if err := db.DB.
		First(&noteAsset, "id = ? AND note_id = ?", assetID, noteID).
		Error; err != nil {
		return noteAsset, storage.AssetFileInfo{}, nil, err
	}

	assetInfo, err := storage_backend.GetNoteAssetInfo(noteID, assetID)
	if err != nil {
		return noteAsset, storage.AssetFileInfo{}, nil, err
	}

	if stream, err := storage_backend.ReadNoteAsset(noteID, assetID); err != nil {
		return noteAsset, storage.AssetFileInfo{}, nil, err
	} else {
		return noteAsset, assetInfo, stream, nil
	}
}

func (s AssetsService) DeleteNoteAssetByID(
	userID uuid.UUID,
	noteID uuid.UUID,
	assetID uuid.UUID,
	storage_backend storage.StorageController) error {
	var count int64
	if err := db.DB.
		Model(&db.NoteAsset{}).
		Joins("JOIN notes ON note_assets.note_id = notes.id").
		Joins("JOIN books ON books.id = notes.book_id").
		Where("owner_id = ? AND notes.id = ?", userID, noteID).
		Limit(1).
		Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return NotFoundError
	}

	return db.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.
			Unscoped().
			Delete(&db.NoteAsset{}, "id = ? AND note_id = ?", assetID, noteID).
			Error; err != nil {
			return err
		}
		return storage_backend.DeleteNoteAsset(noteID, assetID)
	})
}
