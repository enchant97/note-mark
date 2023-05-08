package routes

import (
	"net/http"

	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/labstack/echo/v4"
)

func postCreateUser(ctx echo.Context) error {
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
	if err := db.DB.Model(&user).First("id = ?", authenticatedUser.UserID).Error; err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, user)
}
