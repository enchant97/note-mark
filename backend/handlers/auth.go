package handlers

import (
	"context"
	"errors"
	"log"
	"net/http"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/danielgtaylor/huma/v2"
	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/middleware"
	"github.com/enchant97/note-mark/backend/services"
	"golang.org/x/oauth2"
)

func SetupAuthHandler(api huma.API, appConfig config.AppConfig, authProvider middleware.AuthDetailsProvider) {
	authHandler := AuthHandler{
		AppConfig:    appConfig,
		authProvider: authProvider,
	}
	if appConfig.OIDC != nil {
		p, err := oidc.NewProvider(context.Background(), appConfig.OIDC.IssuerUrl)
		if err != nil {
			log.Fatal(err)
		}
		authHandler.OidcProvider = p
		authHandler.OidcVerifier = p.Verifier(&oidc.Config{ClientID: appConfig.OIDC.ClientID})

	}
	huma.Post(api, "/api/auth/token", authHandler.PostToken)
	huma.Post(api, "/api/auth/oidc-exchange", authHandler.PostExchangeOidcToken)
	huma.Get(api, "/api/auth/am-i-authenticated", authHandler.GetAmIAuthenticated)
	huma.Get(api, "/api/auth/logout", authHandler.GetLogout)
}

type PostTokenInput struct {
	Body core.AccessTokenRequest
}

type PostCookieOutput struct {
	SetCookie http.Cookie `header:"Set-Cookie"`
}

type PostExchangeOidcTokenInput struct {
	Body struct {
		AccessToken string `json:"accessToken"`
		IDToken     string `json:"idToken"`
	}
}

type GetAmIAuthenticatedOutput struct {
	Body bool
}

type AuthHandler struct {
	services.AuthService
	AppConfig    config.AppConfig
	authProvider middleware.AuthDetailsProvider
	OidcProvider *oidc.Provider
	OidcVerifier *oidc.IDTokenVerifier
}

func (h AuthHandler) PostToken(ctx context.Context, input *PostTokenInput) (*PostCookieOutput, error) {
	if token, err := h.AuthService.GetAccessToken(h.AppConfig, input.Body.Username, input.Body.Password); err != nil {
		if errors.Is(err, services.InvalidCredentialsError) {
			return nil, huma.Error401Unauthorized("invalid credentials given")
		} else if errors.Is(err, services.LoginDisabledError) {
			return nil, huma.Error403Forbidden("internal authentication has been disabled")
		} else {
			return nil, err
		}
	} else {
		return &PostCookieOutput{
			SetCookie: h.authProvider.CreateSessionCookie(token),
		}, nil
	}
}

func (h AuthHandler) PostExchangeOidcToken(
	ctx context.Context,
	input *PostExchangeOidcTokenInput,
) (*PostCookieOutput, error) {
	if h.OidcVerifier == nil {
		return nil, huma.Error404NotFound("oidc authentication has not been setup")
	}
	oidcToken, err := h.OidcVerifier.Verify(context.Background(), input.Body.IDToken)
	if err != nil {
		return nil, err
	}
	userSub := oidcToken.Subject
	if h.AppConfig.OIDC.EnableUserCreation {
		type Claims struct {
			PreferredUsername string `json:"preferred_username"`
		}
		var claims Claims
		if err := oidcToken.Claims(&claims); err != nil || claims.PreferredUsername == "" {
			// only request user info if claims were not provided
			// (some providers give them in the claims when 'profile' scope is included)
			userInfo, err := h.OidcProvider.UserInfo(context.Background(), oauth2.StaticTokenSource(&oauth2.Token{
				AccessToken: input.Body.AccessToken,
			}))
			if err != nil {
				return nil, err
			}
			if err := userInfo.Claims(&claims); err != nil {
				return nil, err
			}
		}
		if claims.PreferredUsername == "" {
			return nil, huma.Error500InternalServerError("oidc 'preferred_username' is blank or missing")
		}
		if err := h.AuthService.TryCreateNewOidcUser(h.AppConfig, claims.PreferredUsername, userSub); err != nil {
			return nil, err
		}
	}
	if accessToken, err := h.AuthService.GetAccessTokenForOidcUser(h.AppConfig, userSub); err != nil {
		return nil, err
	} else {
		return &PostCookieOutput{
			SetCookie: h.authProvider.CreateSessionCookie(accessToken),
		}, nil
	}
}

func (h AuthHandler) GetAmIAuthenticated(
	ctx context.Context,
	input *struct{},
) (*GetAmIAuthenticatedOutput, error) {
	details, ok := h.authProvider.TryGetAuthDetails(ctx)
	return &GetAmIAuthenticatedOutput{
		Body: ok && details.IsAuthenticated(),
	}, nil
}

func (h AuthHandler) GetLogout(
	ctx context.Context,
	input *struct{},
) (*PostCookieOutput, error) {
	return &PostCookieOutput{
		SetCookie: h.authProvider.CreateClearSessionCookie(),
	}, nil
}
