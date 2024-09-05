package handlers

import (
	"github.com/enchant97/note-mark/backend/core"
	"github.com/labstack/echo/v4"
)

const (
	AuthDetailsKey = "AuthDetails"
	UserTokenKey   = "UserToken"
)

func getAuthDetails(ctx echo.Context) *core.AuthenticationDetails {
	return ctx.Get(AuthDetailsKey).(*core.AuthenticationDetails)
}
