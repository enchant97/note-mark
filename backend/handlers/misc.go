package handlers

import (
	"net/http"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/labstack/echo/v4"
)

type MiscHandler struct {
	AppConfig config.AppConfig
}

func (h MiscHandler) GetServerInfo(ctx echo.Context) error {
	return ctx.JSON(http.StatusOK, core.ServerInfo{
		MinSupportedVersion: "0.12.0",
		AllowSignup:         h.AppConfig.AllowSignup,
	})
}
