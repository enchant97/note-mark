package handlers

import (
	"errors"
	"net/http"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/services"
	"github.com/labstack/echo/v4"
)

type AuthHandler struct {
	services.AuthService
}

func (h AuthHandler) PostToken(ctx echo.Context) error {
	appConfig := ctx.Get("AppConfig").(config.AppConfig)
	var loginData core.AccessTokenRequest
	if err := core.BindAndValidate(ctx, &loginData); err != nil {
		return err
	}

	if token, err := h.AuthService.GetAccessToken(appConfig, loginData.Username, loginData.Password); err != nil {
		if errors.Is(err, services.AuthServiceInvalidCredentialsError) {
			return ctx.NoContent(http.StatusUnauthorized)
		} else {
			return err
		}
	} else {
		return ctx.JSON(http.StatusOK, token)
	}
}
