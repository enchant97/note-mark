package handlers

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/services"
	"github.com/enchant97/note-mark/backend/storage"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type AssetsHandler struct {
	services.AssetsService
	AppConfig config.AppConfig
	Storage   storage.StorageController
}

func (h AssetsHandler) PostNoteAsset(ctx echo.Context) error {
	authenticatedUser := getAuthDetails(ctx).GetAuthenticatedUser()
	noteID, err := uuid.Parse(ctx.Param("noteID"))
	if err != nil {
		return err
	}

	name := ctx.Request().Header.Get("X-Name")

	if name == "" {
		return ctx.NoContent(http.StatusBadRequest)
	}

	body := ctx.Request().Body
	defer body.Close()

	if asset, err := h.AssetsService.CreateNoteAsset(
		authenticatedUser.UserID,
		noteID,
		name,
		body,
		h.Storage); err != nil {
		if errors.Is(err, services.AssetsServiceNotFoundError) {
			return ctx.NoContent(http.StatusNotFound)
		} else {
			return err
		}
	} else {
		return ctx.JSON(http.StatusCreated, asset)
	}
}

func (h AssetsHandler) GetNoteAssets(ctx echo.Context) error {
	optionalUserID := getAuthDetails(ctx).GetOptionalUserID()
	noteID, err := uuid.Parse(ctx.Param("noteID"))
	if err != nil {
		return err
	}

	if assets, err := h.AssetsService.GetNoteAssets(
		optionalUserID,
		noteID,
		h.Storage); err != nil {
		return err
	} else {
		return ctx.JSON(http.StatusOK, assets)
	}
}

// TODO Work out way to authenticate this
func (h AssetsHandler) GetNoteAssetContentByID(ctx echo.Context) error {
	noteID, err := uuid.Parse(ctx.Param("noteID"))
	if err != nil {
		return err
	}
	assetID, err := uuid.Parse(ctx.Param("assetID"))
	if err != nil {
		return err
	}

	if asset, info, stream, err := h.AssetsService.GetNoteAssetContentByID(
		noteID,
		assetID,
		h.Storage); err != nil {
		return err
	} else {
		defer stream.Close()
		if needNewContent := core.HandleETag(ctx, info.Checksum); !needNewContent {
			return ctx.NoContent(http.StatusNotModified)
		}
		ctx.Response().Header().Set(
			"Last-Modified",
			core.TimeIntoHTTPFormat(info.LastModified),
		)
		ctx.Response().Header().Set(
			"Content-Disposition",
			fmt.Sprintf("inline; filename=\"%s\"", asset.Name),
		)
		return ctx.Stream(http.StatusOK, info.MimeType, stream)
	}
}

func (h AssetsHandler) DeleteNoteAssetByID(ctx echo.Context) error {
	authenticatedUser := getAuthDetails(ctx).GetAuthenticatedUser()
	noteID, err := uuid.Parse(ctx.Param("noteID"))
	if err != nil {
		return err
	}
	assetID, err := uuid.Parse(ctx.Param("assetID"))
	if err != nil {
		return err
	}

	if err := h.AssetsService.DeleteNoteAssetByID(
		authenticatedUser.UserID,
		noteID,
		assetID,
		h.Storage); err != nil {
		if errors.Is(err, services.AssetsServiceNotFoundError) {
			return ctx.NoContent(http.StatusNotFound)
		} else {
			return err
		}
	} else {
		return ctx.NoContent(http.StatusNoContent)
	}
}
