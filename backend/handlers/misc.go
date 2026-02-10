package handlers

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
)

func SetupMiscHandler(api huma.API, appConfig config.AppConfig) {
	miscHandler := MiscHandler{
		AppConfig: appConfig,
	}
	huma.Register(api, huma.Operation{
		Method:      http.MethodGet,
		Path:        "/api/info",
		Tags:        []string{"Miscellaneous"},
		Summary:     "Get api server info",
		OperationID: "GetServerInfo",
	}, miscHandler.GetServerInfo)
}

type GetServerInfoOutput struct {
	Body core.ServerInfo
}

type MiscHandler struct {
	AppConfig config.AppConfig
}

func (h MiscHandler) GetServerInfo(
	ctx context.Context,
	input *struct{},
) (*GetServerInfoOutput, error) {
	var oidcProvider *core.OidcProviderInfo
	if h.AppConfig.OIDC != nil {
		oidcProvider = &core.OidcProviderInfo{
			DisplayName: h.AppConfig.OIDC.DisplayName,
			IssuerURL:   h.AppConfig.OIDC.IssuerUrl,
			ClientID:    h.AppConfig.OIDC.ClientID,
		}
	}
	return &GetServerInfoOutput{
		Body: core.ServerInfo{
			MinSupportedVersion:       "1.0.0",
			AllowInternalSignup:       h.AppConfig.EnableInternalSignup,
			AllowInternalLogin:        h.AppConfig.EnableInternalLogin,
			EnableAnonymousUserSearch: h.AppConfig.EnableAnonymousUserSearch,
			OidcProvider:              oidcProvider,
		}}, nil
}
