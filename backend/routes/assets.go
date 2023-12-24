package routes

import (
	"fmt"
	"net/http"

	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/storage"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type StoredAsset struct {
	db.NoteAsset
	Info storage.AssetFileInfo `json:"info"`
}

func createNoteAsset(ctx echo.Context) error {
	authenticatedUser := getAuthDetails(ctx).GetAuthenticatedUser()
	noteID, err := uuid.Parse(ctx.Param("noteID"))
	if err != nil {
		return err
	}

	name := ctx.Request().Header.Get("X-Name")

	if name == "" {
		return ctx.NoContent(http.StatusBadRequest)
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

	noteAsset := db.NoteAsset{
		NoteID: noteID,
		Name:   name,
	}

	if err := db.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&noteAsset).Error; err != nil {
			return err
		}
		body := ctx.Request().Body
		defer body.Close()
		return storage_backend.WriteNoteAsset(noteID, noteAsset.ID, body)
	}); err != nil {
		return err
	}

	if info, err := storage_backend.GetNoteAssetInfo(noteID, noteAsset.ID); err != nil {
		return err
	} else {
		return ctx.JSON(http.StatusCreated, StoredAsset{
			NoteAsset: noteAsset,
			Info:      info,
		})
	}
}

func getNoteAssets(ctx echo.Context) error {
	optionalUserID := getAuthDetails(ctx).GetOptionalUserID()
	noteID, err := uuid.Parse(ctx.Param("noteID"))
	if err != nil {
		return err
	}

	var noteAssets []db.NoteAsset

	if err := db.DB.
		Preload("Note.Book").
		Joins("JOIN notes ON notes.id = note_assets.note_id").
		Joins("JOIN books ON books.id = notes.book_id").
		Where(
			db.DB.Where("books.owner_id = ? OR books.is_public = ?", optionalUserID, true),
			db.DB.Where("notes.id = ?", noteID),
		).
		Find(&noteAssets).
		Error; err != nil {
		return err
	}

	storage_backend := ctx.Get("Storage").(storage.StorageController)

	storedAssets := make([]StoredAsset, 0)
	for _, noteAsset := range noteAssets {
		if info, err := storage_backend.GetNoteAssetInfo(noteID, noteAsset.ID); err != nil {
			return err
		} else {
			storedAssets = append(storedAssets, StoredAsset{
				NoteAsset: noteAsset,
				Info:      info,
			})
		}
	}

	return ctx.JSON(http.StatusOK, storedAssets)
}

// TODO Work out way to authenticate this
func getNoteAssetContentByID(ctx echo.Context) error {
	noteID, err := uuid.Parse(ctx.Param("noteID"))
	if err != nil {
		return err
	}
	assetID, err := uuid.Parse(ctx.Param("assetID"))
	if err != nil {
		return err
	}

	var noteAsset db.NoteAsset

	if err := db.DB.
		First(&noteAsset, "id = ? AND note_id = ?", assetID, noteID).
		Error; err != nil {
		return err
	}

	storage_backend := ctx.Get("Storage").(storage.StorageController)

	assetInfo, err := storage_backend.GetNoteAssetInfo(noteID, assetID)
	if err != nil {
		return err
	}

	if needNewContent := core.HandleETag(ctx, assetInfo.Checksum); !needNewContent {
		return ctx.NoContent(http.StatusNotModified)
	}

	if stream, err := storage_backend.ReadNoteAsset(noteID, assetID); err != nil {
		return err
	} else {
		defer stream.Close()
		ctx.Response().Header().Set(
			"Last-Modified",
			core.TimeIntoHTTPFormat(assetInfo.LastModified),
		)
		ctx.Response().Header().Set(
			"Content-Disposition",
			fmt.Sprintf("inline; filename=\"%s\"", noteAsset.Name),
		)
		return ctx.Stream(http.StatusOK, assetInfo.MimeType, stream)
	}
}

func deleteNoteAssetByID(ctx echo.Context) error {
	authenticatedUser := getAuthDetails(ctx).GetAuthenticatedUser()
	noteID, err := uuid.Parse(ctx.Param("noteID"))
	if err != nil {
		return err
	}
	assetID, err := uuid.Parse(ctx.Param("assetID"))
	if err != nil {
		return err
	}

	var count int64
	if err := db.DB.
		Model(&db.NoteAsset{}).
		Joins("JOIN notes ON note_assets.note_id = notes.id").
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

	if err := db.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.
			Unscoped().
			Delete(&db.NoteAsset{}, "id = ? AND note_id = ?", assetID, noteID).
			Error; err != nil {
			return err
		}
		return storage_backend.DeleteNoteAsset(noteID, assetID)
	}); err != nil {
		return err
	}

	return ctx.NoContent(http.StatusNoContent)
}
