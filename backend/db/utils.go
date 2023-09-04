package db

import (
	"fmt"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func getSQLite(conf config.DBConfig) (*gorm.DB, error) {
	return gorm.Open(sqlite.Open(conf.URI), &gorm.Config{})

}

func getPostgresSQL(conf config.DBConfig) (*gorm.DB, error) {
	return gorm.Open(postgres.Open(conf.URI), &gorm.Config{})
}

func InitDB(conf config.DBConfig) error {
	var err error
	switch conf.Type {
	case "sqlite":
		DB, err = getSQLite(conf)
		// https://www.sqlite.org/pragma.html#pragma_foreign_keys
		DB.Exec("PRAGMA foreign_keys = '1';").Commit()
	case "postgres":
		DB, err = getPostgresSQL(conf)
	default:
		return fmt.Errorf("invalid db type '%s'", conf.Type)
	}

	if err != nil {
		return err
	}

	return DB.AutoMigrate(
		&User{},
		&Book{},
		&Note{},
	)
}
