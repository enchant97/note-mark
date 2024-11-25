package handlers

import (
	"context"

	"github.com/danielgtaylor/huma/v2"
	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
)

func SetupMiscHandler(api huma.API, appConfig config.AppConfig) {
	miscHandler := MiscHandler{
		AppConfig: appConfig,
	}
	huma.Get(api, "/api/info", miscHandler.GetServerInfo)
}

type GetServerInfoOutput struct {
	Body core.ServerInfo
}

type MiscHandler struct {
	AppConfig config.AppConfig
}

func (h MiscHandler) GetServerInfo(ctx context.Context, input *struct{}) (*GetServerInfoOutput, error) {
	return &GetServerInfoOutput{
		Body: core.ServerInfo{
			MinSupportedVersion:       "0.15.0",
			AllowSignup:               h.AppConfig.AllowSignup,
			EnableAnonymousUserSearch: h.AppConfig.EnableAnonymousUserSearch,
		}}, nil
}
