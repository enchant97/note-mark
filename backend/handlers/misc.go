package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/conditional"
	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
)

func SetupMiscHandler(api huma.API, appConfig config.AppConfig) {
	miscHandler := MiscHandler{
		AppConfig: appConfig,
		setupTime: time.Now().UTC(),
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
	Body         core.ServerInfo
	CacheControl string    `header:"Cache-Control"`
	LastModified time.Time `header:"Last-Modified"`
}

type MiscHandler struct {
	AppConfig config.AppConfig
	setupTime time.Time
}

func (h MiscHandler) GetServerInfo(
	ctx context.Context,
	input *conditional.Params,
) (*GetServerInfoOutput, error) {
	if input.HasConditionalParams() {
		if err := input.PreconditionFailed("", h.setupTime.Truncate(time.Second)); err != nil {
			return nil, err
		}
	}
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
		},
		CacheControl: "no-cache, public",
		LastModified: h.setupTime,
	}, nil
}
