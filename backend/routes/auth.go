package routes

import (
	"net/http"
	"time"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/labstack/echo/v4"
)

func postToken(ctx echo.Context) error {
	appConfig := ctx.Get("AppConfig").(config.AppConfig)
	var loginData core.AccessTokenRequest
	if err := core.BindAndValidate(ctx, &loginData); err != nil {
		return err
	}

	var user db.User
	if err := db.DB.
		First(&user, "username = ?", loginData.Username).
		Select("id", "password").Error; err != nil {
		return ctx.NoContent(http.StatusUnauthorized)
	}

	if !user.IsPasswordMatch(loginData.Password) {
		return ctx.NoContent(http.StatusUnauthorized)
	}

	authenticationData := core.AuthenticatedUser{
		UserID: user.ID,
	}

	// user is valid, create a token
	if token, err := core.CreateAuthenticationToken(
		authenticationData,
		[]byte(appConfig.JWTSecret),
		time.Duration(int64(time.Second)*appConfig.TokenExpiry),
	); err != nil {
		return err
	} else {
		return ctx.JSON(http.StatusOK, token)
	}
}
