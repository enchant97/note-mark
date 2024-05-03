package cli

import (
	"errors"
	"io"
	"log"
	"os"
	"path"
	"strings"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/storage"
	"github.com/google/uuid"
	"github.com/urfave/cli/v2"
	"gorm.io/gorm"
)

func findDirs(p string) ([]string, error) {
	dirs := make([]string, 0)
	if entries, err := os.ReadDir(p); err != nil {
		return nil, err
	} else {
		for _, entry := range entries {
			if entry.IsDir() {
				dirs = append(dirs, entry.Name())
			}
		}
	}
	return dirs, nil
}

func findFiles(p string) ([]string, error) {
	files := make([]string, 0)
	if entries, err := os.ReadDir(p); err != nil {
		return nil, err
	} else {
		for _, entry := range entries {
			if entry.Type().IsRegular() {
				files = append(files, entry.Name())
			}
		}
	}
	return files, nil
}

func filterBySuffix(values []string, suffix string) []string {
	filtered := make([]string, 0)
	for _, v := range values {
		if strings.HasSuffix(v, suffix) {
			filtered = append(filtered, v)
		}
	}
	return filtered
}

func commandMigrateImportData(appConfig config.AppConfig, importDir string) error {
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

	log.Println("discovering users and mapping to IDs")

	// discover usernames and map to their IDs
	userIDs := make(map[string]uuid.UUID, 0)
	if rootEntries, err := os.ReadDir(importDir); err != nil {
		return err
	} else {
		for _, entry := range rootEntries {
			if entry.IsDir() {
				var userID string
				if err := db.DB.
					Model(&db.User{}).
					Where("username = ?", entry.Name()).
					Pluck("ID", &userID).
					Error; err != nil {
					return err
				}
				log.Printf("mapped user '%s' to '%s'\n", entry.Name(), userID)
				userIDs[entry.Name()] = uuid.MustParse(userID)
			}
		}
	}

	log.Println("starting import, this may take some time...")

	if err := db.DB.Transaction(func(tx *gorm.DB) error {
		for username, userID := range userIDs {
			log.Printf("starting import on user '%s'\n", username)
			bookSlugs, err := findDirs(path.Join(importDir, username))
			if err != nil {
				return err
			}
			for _, bookSlug := range bookSlugs {
				book := db.Book{
					OwnerID: userID,
					Name:    bookSlug,
					Slug:    bookSlug,
				}
				if err := tx.Create(&book).Error; err != nil {
					return err
				}
				noteFiles, err := findFiles(path.Join(importDir, username, bookSlug))
				if err != nil {
					return err
				}
				noteFiles = filterBySuffix(noteFiles, ".md")
				for _, noteFile := range noteFiles {
					noteSlug := strings.TrimSuffix(noteFile, ".md")
					log.Printf("importing '%s/%s/%s'", username, bookSlug, noteSlug)
					note := db.Note{
						Name:   noteSlug,
						Slug:   noteSlug,
						BookID: book.ID,
					}
					if err := tx.Create(&note).Error; err != nil {
						return err
					}
					f, err := os.Open(path.Join(importDir, username, bookSlug, noteFile))
					if err != nil {
						return err
					}
					if err := storage_backend.WriteNote(note.ID, f); err != nil {
						return err
					}
				}
			}
			log.Printf("finished import on user '%s'\n", username)
		}
		return nil
	}); err != nil {
		return err
	}

	log.Println("finished import")

	return nil
}

func commandMigrateExportData(appConfig config.AppConfig, exportDir string) error {
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

	log.Println("ensuring export directory exists and is empty")
	if err := os.MkdirAll(exportDir, os.ModePerm); err != nil {
		return err
	}
	if isEmpty := core.IsDirEmpty(exportDir); !isEmpty {
		return cli.Exit("export directory not empty", 1)
	}

	log.Println("starting export, this may take some time...")

	var userRows []db.User
	if err := db.DB.
		Preload("Books").
		Preload("Books.Notes").
		Preload("Books.Notes.Assets").
		FindInBatches(&userRows, 1, func(tx *gorm.DB, batch int) error {
			for _, user := range userRows {
				log.Printf("starting export on user '%s'\n", user.Username)

				for _, book := range user.Books {
					bookDir := path.Join(exportDir, user.Username, book.Slug)
					for _, note := range book.Notes {
						log.Printf("exporting '%s/%s/%s'\n", user.Username, book.Slug, note.Slug)

						noteDir := path.Join(bookDir, note.Slug)
						if err := os.MkdirAll(noteDir, os.ModePerm); err != nil {
							return err
						}
						// export note content
						r, err := storage_backend.ReadNote(note.ID)
						if err != nil && errors.Is(err, storage.ErrNotFound) {
							r = io.NopCloser(strings.NewReader(""))
						} else if err != nil {
							return err
						}
						defer r.Close()
						f, err := os.Create(path.Join(noteDir, "_index.md"))
						if err != nil {
							return err
						}
						defer f.Close()
						if _, err = io.Copy(f, r); err != nil {
							return err
						}
						// export note assets
						if len(note.Assets) != 0 {
							log.Printf("exporting '%s/%s/%s' assets\n", user.Username, book.Slug, note.Slug)
							assetsDir := path.Join(noteDir, "assets")
							if err := os.MkdirAll(assetsDir, os.ModePerm); err != nil {
								return err
							}
							for _, asset := range note.Assets {
								if r, err := storage_backend.ReadNoteAsset(note.ID, asset.ID); err != nil {
									return err
								} else {
									defer r.Close()
									f, err := os.Create(path.Join(assetsDir, asset.ID.String()+"."+asset.Name))
									if err != nil {
										return err
									}
									defer f.Close()
									if _, err = io.Copy(f, r); err != nil {
										return err
									}
								}
							}
						}
					}
				}

				log.Printf("finished export on user '%s'\n", user.Username)
			}
			return nil
		}).Error; err != nil {
		return err
	}

	log.Println("finished export")

	return nil
}
