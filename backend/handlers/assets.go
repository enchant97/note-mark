package handlers

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/conditional"
	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/middleware"
	"github.com/enchant97/note-mark/backend/services"
	"github.com/enchant97/note-mark/backend/storage"
	"github.com/google/uuid"
)

func SetupAssetsHandler(
	api huma.API,
	appConfig config.AppConfig,
	storage_backend storage.StorageController,
	authProvider middleware.AuthDetailsProvider,
) {
	assetsHandler := AssetsHandler{
		AppConfig:    appConfig,
		Storage:      storage_backend,
		AuthProvider: authProvider,
	}
	huma.Register(api, huma.Operation{
		Method:        http.MethodPost,
		Path:          "/api/notes/{noteID}/assets",
		Middlewares:   huma.Middlewares{authProvider.AuthRequiredMiddleware},
		MaxBodyBytes:  int64(appConfig.AssetSizeLimit),
		DefaultStatus: http.StatusCreated,
	}, assetsHandler.PostNoteAsset)
	huma.Get(api, "/api/notes/{noteID}/assets", assetsHandler.GetNoteAssets)
	huma.Get(api, "/api/notes/{noteID}/assets/{assetID}", assetsHandler.GetNoteAssetContentByID)
	huma.Register(api, huma.Operation{
		Method:      http.MethodDelete,
		Path:        "/api/notes/{noteID}/assets/{assetID}",
		Middlewares: huma.Middlewares{authProvider.AuthRequiredMiddleware},
	}, assetsHandler.DeleteNoteAssetByID)
}

type PostNoteAssetInput struct {
	NoteID  uuid.UUID `path:"noteID" format:"uuid"`
	Name    string    `header:"X-Name" required:"true"`
	RawBody []byte    `required:"true"`
}

type PostNoteAssetOutput struct {
	Body services.StoredAsset
}

type GetNoteAssetsInput struct {
	NoteID uuid.UUID `path:"noteID" format:"uuid"`
}

type GetNoteAssetsOutput struct {
	Body []services.StoredAsset
}

type GetNoteAssetContentByIDInput struct {
	conditional.Params
	NoteID  uuid.UUID `path:"noteID" format:"uuid"`
	AssetID uuid.UUID `path:"assetID" format:"uuid"`
}

type DeleteNoteAssetByIDInput struct {
	NoteID  uuid.UUID `path:"noteID" format:"uuid"`
	AssetID uuid.UUID `path:"assetID" format:"uuid"`
}

type AssetsHandler struct {
	services.AssetsService
	AppConfig    config.AppConfig
	Storage      storage.StorageController
	AuthProvider middleware.AuthDetailsProvider
}

func (h AssetsHandler) PostNoteAsset(
	ctx context.Context,
	input *PostNoteAssetInput) (*PostNoteAssetOutput, error) {
	authDetails, _ := h.AuthProvider.TryGetAuthDetails(ctx)
	body := bytes.NewReader(input.RawBody)
	if asset, err := h.AssetsService.CreateNoteAsset(
		authDetails.GetAuthenticatedUser().UserID,
		input.NoteID,
		input.Name,
		body,
		h.Storage); err != nil {
		if errors.Is(err, services.AssetsServiceNotFoundError) {
			return nil, huma.Error404NotFound("note does not exist or you do not have access")
		} else {
			return nil, err
		}
	} else {
		return &PostNoteAssetOutput{Body: asset}, nil
	}
}

func (h AssetsHandler) GetNoteAssets(
	ctx context.Context,
	input *GetNoteAssetsInput) (*GetNoteAssetsOutput, error) {
	authDetails, _ := h.AuthProvider.TryGetAuthDetails(ctx)
	if assets, err := h.AssetsService.GetNoteAssets(
		authDetails.GetOptionalUserID(),
		input.NoteID,
		h.Storage); err != nil {
		return nil, err
	} else {
		return &GetNoteAssetsOutput{Body: assets}, nil
	}
}

// TODO Work out way to authenticate this
func (h AssetsHandler) GetNoteAssetContentByID(
	ctx context.Context,
	input *GetNoteAssetContentByIDInput) (*huma.StreamResponse, error) {
	if asset, info, stream, err := h.AssetsService.GetNoteAssetContentByID(
		input.NoteID,
		input.AssetID,
		h.Storage); err != nil {
		return nil, err
	} else {
		if input.HasConditionalParams() {
			if err := input.PreconditionFailed(info.Checksum, info.FileInfo.LastModified); err != nil {
				stream.Close()
				return nil, err
			}
		}
		return &huma.StreamResponse{
			Body: func(ctx huma.Context) {
				ctx.SetHeader("Content-Type", info.MimeType)
				ctx.SetHeader(
					"Last-Modified",
					core.TimeIntoHTTPFormat(info.LastModified))
				ctx.SetHeader(
					"Content-Disposition",
					fmt.Sprintf("inline; filename=\"%s\"", asset.Name))
				writer := ctx.BodyWriter()
				io.Copy(writer, stream)
				stream.Close()
			}}, nil
	}
}

func (h AssetsHandler) DeleteNoteAssetByID(ctx context.Context, input *DeleteNoteAssetByIDInput) (*struct{}, error) {
	authDetails, _ := h.AuthProvider.TryGetAuthDetails(ctx)
	if err := h.AssetsService.DeleteNoteAssetByID(
		authDetails.GetAuthenticatedUser().UserID,
		input.NoteID,
		input.AssetID,
		h.Storage); err != nil {
		if errors.Is(err, services.AssetsServiceNotFoundError) {
			return nil, huma.Error404NotFound("note asset does not exist or you do not have access")
		} else {
			return nil, err
		}
	} else {
		return nil, nil
	}
}
