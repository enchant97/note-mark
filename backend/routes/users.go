package routes

import (
	"net/http"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/labstack/echo/v4"
)

func postCreateUser(ctx echo.Context) error {
	appConfig := ctx.Get("AppConfig").(config.AppConfig)

	if !appConfig.AllowSignup {
		return ctx.NoContent(http.StatusForbidden)
	}

	var userData db.CreateUser
	if err := core.BindAndValidate(ctx, &userData); err != nil {
		return err
	}

	user := userData.IntoUser()
	if err := db.DB.Create(&user).Error; err != nil {
		return err
	}

	return ctx.JSON(http.StatusCreated, user)
}

func getUserMe(ctx echo.Context) error {
	authenticatedUser := getAuthenticatedUser(ctx)

	var user db.User
	if err := db.DB.
		First(&user, "id = ?", authenticatedUser.UserID).Error; err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, user)
}

func searchForUser(ctx echo.Context) error {
	var params core.FindUserParams
	if err := core.BindAndValidate(ctx, &params); err != nil {
		return err
	}

	var users []string
	if err := db.DB.
		Model(&db.User{}).
		Limit(6).
		Where("username LIKE ?", params.Username+"%").
		Pluck("username", &users).
		Error; err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, users)
}
