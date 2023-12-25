package routes

import (
	"net/http"

	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/storage"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type CreatedAsset struct {
	AssetID  uuid.UUID             `json:"assetId"`
	FileInfo storage.AssetFileInfo `json:"fileInfo"`
}

func createNoteAsset(ctx echo.Context) error {
	authenticatedUserID := getAuthDetails(ctx).GetAuthenticatedUser()
	noteID, err := uuid.Parse(ctx.Param("noteID"))
	if err != nil {
		return err
	}

	var count int64
	if err := db.DB.
		Model(&db.Note{}).
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id").
		Where("owner_id = ? AND notes.id = ?", authenticatedUserID, noteID).
		Limit(1).
		Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return ctx.NoContent(http.StatusNotFound)
	}

	storage_backend := ctx.Get("Storage").(storage.StorageController)

	assetID := uuid.New()

	body := ctx.Request().Body
	defer body.Close()
	if err := storage_backend.WriteNoteAsset(noteID, assetID, body); err != nil {
		return err
	}

	return ctx.JSON(http.StatusCreated, assetID)
}

func getNoteAssets(ctx echo.Context) error {
	optionalUserID := getAuthDetails(ctx).GetOptionalUserID()
	noteID, err := uuid.Parse(ctx.Param("noteID"))
	if err != nil {
		return err
	}

	var count int64
	if err := db.DB.
		Model(&db.Note{}).
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id").
		Where("owner_id = ? OR is_public = ?", optionalUserID, true).
		Where("notes.id = ?", noteID).
		Limit(1).
		Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return ctx.NoContent(http.StatusNotFound)
	}

	storage_backend := ctx.Get("Storage").(storage.StorageController)

	if assetIDs, err := storage_backend.GetNoteAssetIDs(noteID); err != nil {
		return err
	} else {
		return ctx.JSON(http.StatusOK, assetIDs)
	}
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

	var count int64
	if err := db.DB.
		Model(&db.Note{}).
		Where("notes.id = ?", noteID).
		Limit(1).
		Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return ctx.NoContent(http.StatusNotFound)
	}

	storage_backend := ctx.Get("Storage").(storage.StorageController)

	if stream, err := storage_backend.ReadNoteAsset(noteID, assetID); err != nil {
		return err
	} else {
		defer stream.Close()
		return ctx.Stream(http.StatusOK, "application/octet-stream", stream)
	}
}

func deleteNoteAssetByID(ctx echo.Context) error {
	authenticatedUserID := getAuthDetails(ctx).GetAuthenticatedUser()
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
		Model(&db.Note{}).
		Preload("Book").
		Joins("JOIN books ON books.id = notes.book_id").
		Where("owner_id = ? AND notes.id = ?", authenticatedUserID, noteID).
		Limit(1).
		Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return ctx.NoContent(http.StatusNotFound)
	}

	storage_backend := ctx.Get("Storage").(storage.StorageController)

	if err := storage_backend.DeleteNoteAsset(noteID, assetID); err != nil {
		return err
	}

	return ctx.NoContent(http.StatusNoContent)
}
