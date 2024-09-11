package handlers

import (
	"context"
	"errors"

	"github.com/danielgtaylor/huma/v2"
	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/services"
)

func SetupAuthHandler(api huma.API, appConfig config.AppConfig) {
	authHandler := AuthHandler{
		AppConfig: appConfig,
	}
	huma.Post(api, "/api/auth/token", authHandler.PostToken)
}

type PostTokenInput struct {
	Body core.AccessTokenRequest
}

type PostTokenOutput struct {
	Body core.AccessToken
}

type AuthHandler struct {
	services.AuthService
	AppConfig config.AppConfig
}

func (h AuthHandler) PostToken(ctx context.Context, input *PostTokenInput) (*PostTokenOutput, error) {
	if token, err := h.AuthService.GetAccessToken(h.AppConfig, input.Body.Username, input.Body.Password); err != nil {
		if errors.Is(err, services.AuthServiceInvalidCredentialsError) {
			return nil, huma.Error401Unauthorized("invalid credentials given")
		} else {
			return nil, err
		}
	} else {
		return &PostTokenOutput{
			Body: token,
		}, nil
	}
}
