package cli

import (
	"errors"
	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/handlers"
	"github.com/enchant97/note-mark/backend/storage"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gorm.io/gorm"
	"net/http"
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

func commandServe(appConfig config.AppConfig) error {
	// Connect to storage backend
	storage_backend := storage.DiskController{}.New(appConfig.DataPath)
	if err := storage_backend.Setup(); err != nil {
		return err
	}
	defer storage_backend.TearDown()
	// Connect to database
	if err := db.InitDB(appConfig.DB); err != nil {
		return err
	}
	// Create server
	e := echo.New()
	e.HTTPErrorHandler = httpErrorHandler
	// Register root middleware
	e.Use(middleware.Recover())
	e.Use(middleware.Logger())
	v := core.Validator{}.New()
	e.Validator = &v
	// Init routes
	if err := handlers.SetupHandlers(e, appConfig, storage_backend); err != nil {
		return err
	}
	// Start server
	return e.Start(appConfig.Bind.AsAddress())
}
