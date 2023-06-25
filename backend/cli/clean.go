package cli

import (
	"log"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/storage"
	"gorm.io/gorm"
)

func commandClean(appConfig config.AppConfig) error {
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

    log.Println("starting clean-up, this may take some time...")

	// Delete Notes & Contents
	log.Println("cleaning-up notes...")
	var results []db.Note
	if err := db.DB.Unscoped().
		Model(&db.Note{}).
		Where("deleted_at IS NOT NULL").
		Select("id").
		FindInBatches(&results, 1, func(tx *gorm.DB, batch int) error {
			for _, result := range results {
				if err := tx.Transaction(func(tx *gorm.DB) error {
					if err := tx.Unscoped().Delete(&result).Error; err != nil {
						return err
					}
					if err := storage_backend.DeleteNote(result.ID); err != nil {
						return err
					}
					return nil
				}); err != nil {
					return err
				}
			}
			return nil
		}).Error; err != nil {
		return err
	}

	log.Println("cleaning-up books...")
	// Delete Note Books
	if err := db.DB.Unscoped().
		Where("deleted_at IS NOT NULL").
		Delete(&db.Book{}).Error; err != nil {
		return err
	}

	log.Println("cleaning-up users...")
	// Delete Users
	if err := db.DB.Unscoped().
		Where("deleted_at IS NOT NULL").
		Delete(&db.User{}).Error; err != nil {
		return err
	}

    log.Println("clean-up done")

	return nil
}
