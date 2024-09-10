package handlers

import (
	"errors"
	"net/http"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/services"
	"github.com/labstack/echo/v4"
)

func SetupAuthHandler(g *echo.Group, appConfig config.AppConfig) {
	authHandler := AuthHandler{
		AppConfig: appConfig,
	}
	g.POST("/auth/token", authHandler.PostToken)
}

type AuthHandler struct {
	services.AuthService
	AppConfig config.AppConfig
}

func (h AuthHandler) PostToken(ctx echo.Context) error {
	var loginData core.AccessTokenRequest
	if err := core.BindAndValidate(ctx, &loginData); err != nil {
		return err
	}

	if token, err := h.AuthService.GetAccessToken(h.AppConfig, loginData.Username, loginData.Password); err != nil {
		if errors.Is(err, services.AuthServiceInvalidCredentialsError) {
			return ctx.NoContent(http.StatusUnauthorized)
		} else {
			return err
		}
	} else {
		return ctx.JSON(http.StatusOK, token)
	}
}
