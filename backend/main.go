package main

import (
	"log"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/routes"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	// Parse config
	var appConfig config.AppConfig
	if err := appConfig.ParseConfig(); err != nil {
		log.Fatalln(err)
	}
	// Connect to database
	if err := db.InitDB(appConfig.DB); err != nil {
		log.Fatalln(err)
	}
	// Create server
	e := echo.New()
	// Register root middleware
	e.Use(middleware.Recover())
	e.Use(middleware.Logger())
	v := core.Validator{}.New()
	e.Validator = &v
	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(ctx echo.Context) error {
			ctx.Set("AppConfig", appConfig)
			return next(ctx)
		}
	})
	// Init routes
	routes.InitRoutes(e, appConfig)
	// Start server
	e.Logger.Fatal(e.Start(appConfig.Bind.AsAddress()))
}
