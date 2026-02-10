package handlers

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/middleware"
	"github.com/enchant97/note-mark/backend/services"
)

type AuthHandler struct {
	service      services.AuthService
	appConfig    config.AppConfig
	authProvider middleware.AuthDetailsProvider
}

func SetupAuthHandler(
	api huma.API,
	service services.AuthService,
	appConfig config.AppConfig,
	authProvider *middleware.AuthDetailsProvider,
) {
	handler := AuthHandler{
		service:      service,
		appConfig:    appConfig,
		authProvider: *authProvider,
	}
	huma.Register(api, huma.Operation{
		Method:      http.MethodPost,
		Path:        "/api/auth/s/start",
		Hidden:      true,
		Tags:        []string{"Authentication"},
		Summary:     "Start auth session",
		OperationID: "StartSession",
	}, handler.PostSessionStart)
	huma.Register(api, huma.Operation{
		Method:      http.MethodDelete,
		Path:        "/api/auth/s/end",
		Hidden:      true,
		Tags:        []string{"Authentication"},
		Summary:     "End auth session",
		OperationID: "EndSession",
	}, handler.DeleteSessionEnd)
	huma.Register(api, huma.Operation{
		Method:      http.MethodPost,
		Path:        "/api/auth/o/token",
		Tags:        []string{"Authentication"},
		Summary:     "Request access token",
		OperationID: "RequestAccessToken",
	}, handler.PostCreateToken)
	huma.Register(api, huma.Operation{
		Method:      http.MethodGet,
		Path:        "/api/auth/o/userinfo",
		Middlewares: huma.Middlewares{authProvider.AuthRequiredMiddleware},
		Security:    defaultSecurityOp,
		Tags:        []string{"Authentication"},
		Summary:     "Get user info",
		OperationID: "GetUserInfo",
	}, handler.GetUserInfo)
}

type RequestAccessTokenInput struct {
	Body core.AccessTokenRequest
}

type SetCookieOutput struct {
	SetCookie http.Cookie `header:"Set-Cookie"`
}

type PostCreateTokenOutput struct {
	Body core.AccessToken
}

type GetUserInfoOutput struct {
	Body core.UserInfoResponse
}

func (m *RequestAccessTokenInput) Resolve(ctx huma.Context) []error {
	return middleware.ValidateRequestInput(ctx, m.Body)
}

func (h *AuthHandler) PostSessionStart(
	ctx context.Context,
	input *RequestAccessTokenInput,
) (*SetCookieOutput, error) {
	at, err := h.service.CreateAccessToken(input.Body)
	if err != nil {
		// TODO handle errors
		return nil, err
	}
	return &SetCookieOutput{
		SetCookie: h.authProvider.CreateSessionCookie(at),
	}, nil
}

func (h *AuthHandler) DeleteSessionEnd(
	ctx context.Context,
	input *struct{},
) (*SetCookieOutput, error) {
	return &SetCookieOutput{
		SetCookie: h.authProvider.CreateClearSessionCookie(),
	}, nil
}

func (h *AuthHandler) PostCreateToken(
	ctx context.Context,
	input *RequestAccessTokenInput,
) (*PostCreateTokenOutput, error) {
	at, err := h.service.CreateAccessToken(input.Body)
	if err != nil {
		// TODO handle errors
		return nil, err
	}
	return &PostCreateTokenOutput{
		Body: at,
	}, nil
}

func (h *AuthHandler) GetUserInfo(
	ctx context.Context,
	input *struct{},
) (*GetUserInfoOutput, error) {
	authDetails, _ := h.authProvider.TryGetAuthDetails(ctx)
	currentUsername := authDetails.MustGetAuthenticatedUser().Username
	userInfo, err := h.service.GetUserInfoByUsername(currentUsername)
	if err != nil {
		// TODO handle errors
		return nil, err
	}
	return &GetUserInfoOutput{
		Body: userInfo,
	}, nil
}
