package main

import (
	"errors"
	"log"
	"net/http"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/routes"
	"github.com/enchant97/note-mark/backend/storage"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gorm.io/gorm"
)

// HTTP error handler, to handle unexpected errors
func httpErrorHandler(err error, ctx echo.Context) {
	if e, ok := err.(*echo.HTTPError); ok {
		// normal HTTP error
		ctx.JSON(e.Code, e.Message)
		return
	}
	ctx.Logger().Error(err)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		ctx.NoContent(http.StatusNotFound)
	} else if errors.Is(err, gorm.ErrDuplicatedKey) {
		ctx.NoContent(http.StatusConflict)
	} else if errors.Is(err, core.ErrBind) || errors.Is(err, core.ErrValidation) {
		ctx.NoContent(http.StatusUnprocessableEntity)
	} else {
		ctx.NoContent(http.StatusInternalServerError)
	}
}

func main() {
	// Parse config
	var appConfig config.AppConfig
	if err := appConfig.ParseConfig(); err != nil {
		log.Fatalln(err)
	}
	// Connect to storage backend
	storage_backend := storage.DiskController{}.New(appConfig.DataPath)
	if err := storage_backend.Setup(); err != nil {
		log.Fatalln(err)
	}
	defer storage_backend.TearDown()
	// Connect to database
	if err := db.InitDB(appConfig.DB); err != nil {
		log.Fatalln(err)
	}
	// Create server
	e := echo.New()
	e.HTTPErrorHandler = httpErrorHandler
	// Register root middleware
	e.Use(middleware.Recover())
	e.Use(middleware.Logger())
	corsConfig := middleware.DefaultCORSConfig
	{
		corsConfig.AllowOrigins = appConfig.CORSOrigins
	}
	e.Use(middleware.CORSWithConfig(corsConfig))
	v := core.Validator{}.New()
	e.Validator = &v
	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(ctx echo.Context) error {
			ctx.Set("AppConfig", appConfig)
			ctx.Set("Storage", storage_backend)
			return next(ctx)
		}
	})
	// Init routes
	routes.InitRoutes(e, appConfig)
	// Start server
	e.Logger.Fatal(e.Start(appConfig.Bind.AsAddress()))
}
