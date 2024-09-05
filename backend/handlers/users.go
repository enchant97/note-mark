package handlers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/services"
	"github.com/labstack/echo/v4"
)

type UsersHandler struct {
	services.UsersService
}

func (h UsersHandler) PostCreateUser(ctx echo.Context) error {
	appConfig := ctx.Get("AppConfig").(config.AppConfig)

	var userData db.CreateUser
	if err := core.BindAndValidate(ctx, &userData); err != nil {
		return err
	}

	if user, err := h.UsersService.CreateUser(appConfig, userData); err != nil {
		if errors.Is(err, services.UsersServiceUserSignupDisabledError) {
			return ctx.NoContent(http.StatusForbidden)
		} else {
			return err
		}
	} else {
		return ctx.JSON(http.StatusCreated, user)
	}
}

func (h UsersHandler) GetCurrentUser(ctx echo.Context) error {
	authenticatedUser := getAuthDetails(ctx).GetAuthenticatedUser()
	if user, err := h.UsersService.GetUserProfileByID(authenticatedUser.UserID); err != nil {
		return err
	} else {
		return ctx.JSON(http.StatusOK, user)
	}
}

func (h UsersHandler) GetUserByUsername(ctx echo.Context) error {
	username := ctx.Param("username")
	optionalUserID := getAuthDetails(ctx).GetOptionalUserID()
	include := strings.ToLower(ctx.QueryParam("include"))

	includeBooks := include == "books" || include == "notes"
	includeNotes := include == "notes"

	if user, err := h.UsersService.GetUserByUsername(
		optionalUserID,
		username,
		includeBooks,
		includeNotes); err != nil {
		return err
	} else {
		return ctx.JSON(http.StatusOK, user)
	}
}

func (h UsersHandler) PatchCurrentUser(ctx echo.Context) error {
	authenticatedUser := getAuthDetails(ctx).GetAuthenticatedUser()

	var userData db.UpdateUser
	if err := core.BindAndValidate(ctx, &userData); err != nil {
		return err
	}

	if err := h.UsersService.UpdateUserProfile(authenticatedUser.UserID, userData); err != nil {
		return err
	} else {
		return ctx.NoContent(http.StatusOK)
	}
}

func (h UsersHandler) PatchCurrentUserPassword(ctx echo.Context) error {
	authenticatedUser := getAuthDetails(ctx).GetAuthenticatedUser()

	var userData db.UpdateUserPassword
	if err := core.BindAndValidate(ctx, &userData); err != nil {
		return err
	}

	if err := h.UsersService.UpdateUserPassword(authenticatedUser.UserID, userData); err != nil {
		if errors.Is(err, services.UsersServiceUserPasswordInvalid) {
			return ctx.NoContent(http.StatusForbidden)
		} else {
			return err
		}
	} else {

		return ctx.NoContent(http.StatusOK)
	}
}

func (h UsersHandler) GetSearchForUser(ctx echo.Context) error {
	var params core.FindUserParams
	if err := core.BindAndValidate(ctx, &params); err != nil {
		return err
	}

	if users, err := h.UsersService.GetSearchForUser(params.Username); err != nil {
		return err
	} else {
		return ctx.JSON(http.StatusOK, users)
	}
}
