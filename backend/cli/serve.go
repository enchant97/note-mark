package cli

import (
	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/handlers"
	"github.com/enchant97/note-mark/backend/storage"
)

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
	if e, err := handlers.SetupHandlers(appConfig, storage_backend); err != nil {
		return err
	} else {
		// Start server
		return e.Start(appConfig.Bind.AsAddress())
	}
}
