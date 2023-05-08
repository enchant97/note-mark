package db

import (
	"fmt"

	"github.com/enchant97/note-mark/backend/config"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func getSQLite(conf config.DBConfig) (*gorm.DB, error) {
	return gorm.Open(sqlite.Open(conf.URI), &gorm.Config{})

}

func getMySQL(conf config.DBConfig) (*gorm.DB, error) {
	return gorm.Open(mysql.Open(conf.URI), &gorm.Config{})
}

func getPostgresSQL(conf config.DBConfig) (*gorm.DB, error) {
	return gorm.Open(postgres.Open(conf.URI), &gorm.Config{})
}

func InitDB(conf config.DBConfig) error {
	var err error
	switch conf.Type {
	case "sqlite":
		DB, err = getSQLite(conf)
	case "mysql":
		DB, err = getMySQL(conf)
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
	)
}
