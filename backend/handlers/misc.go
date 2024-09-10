package handlers

import (
	"net/http"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/labstack/echo/v4"
)

func SetupMiscHandler(g *echo.Group, appConfig config.AppConfig) {
	miscHandler := MiscHandler{
		AppConfig: appConfig,
	}
	g.GET("/info", miscHandler.GetServerInfo)
}

type MiscHandler struct {
	AppConfig config.AppConfig
}

func (h MiscHandler) GetServerInfo(ctx echo.Context) error {
	return ctx.JSON(http.StatusOK, core.ServerInfo{
		MinSupportedVersion: "0.12.0",
		AllowSignup:         h.AppConfig.AllowSignup,
	})
}
