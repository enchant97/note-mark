package handlers

import (
	"context"
	"errors"
	"log"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/danielgtaylor/huma/v2"
	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/services"
)

func SetupAuthHandler(api huma.API, appConfig config.AppConfig) {
	authHandler := AuthHandler{
		AppConfig: appConfig,
	}
	if appConfig.OIDC != nil {
		p, err := oidc.NewProvider(context.Background(), appConfig.OIDC.IssuerUrl)
		if err != nil {
			log.Fatal(err)
		}
		authHandler.OidcVerifier = p.Verifier(&oidc.Config{ClientID: appConfig.OIDC.ClientID})

	}
	huma.Post(api, "/api/auth/token", authHandler.PostToken)
	huma.Post(api, "/api/auth/oidc-exchange", authHandler.PostExchangeOidcToken)
}

type PostTokenInput struct {
	Body core.AccessTokenRequest
}

type PostTokenOutput struct {
	Body core.AccessToken
}

type PostExchangeOidcTokenInput struct {
	Body         core.AccessToken
	UsernameHint string `header:"Username-Hint" required:"true"`
}

type AuthHandler struct {
	services.AuthService
	AppConfig    config.AppConfig
	OidcVerifier *oidc.IDTokenVerifier
}

func (h AuthHandler) PostToken(ctx context.Context, input *PostTokenInput) (*PostTokenOutput, error) {
	if token, err := h.AuthService.GetAccessToken(h.AppConfig, input.Body.Username, input.Body.Password); err != nil {
		if errors.Is(err, services.InvalidCredentialsError) {
			return nil, huma.Error401Unauthorized("invalid credentials given")
		} else if errors.Is(err, services.LoginDisabledError) {
			return nil, huma.Error403Forbidden("internal authentication has been disabled")
		} else {
			return nil, err
		}
	} else {
		return &PostTokenOutput{
			Body: token,
		}, nil
	}
}

func (h AuthHandler) PostExchangeOidcToken(
	ctx context.Context,
	input *PostExchangeOidcTokenInput,
) (*PostTokenOutput, error) {
	if h.OidcVerifier == nil {
		return nil, huma.Error404NotFound("oidc authentication has not been setup")
	}
	oidcToken, err := h.OidcVerifier.Verify(context.Background(), input.Body.AccessToken)
	if err != nil {
		return nil, err
	}
	userSub := oidcToken.Subject
	if h.AppConfig.OIDC.EnableUserCreation {
		if err := h.AuthService.TryCreateNewOidcUser(h.AppConfig, input.UsernameHint, userSub); err != nil {
			return nil, err
		}
	}
	if accessToken, err := h.AuthService.GetAccessTokenForOidcUser(h.AppConfig, userSub); err != nil {
		return nil, err
	} else {
		return &PostTokenOutput{
			Body: accessToken,
		}, nil
	}
}
