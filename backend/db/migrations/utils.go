package migrations

import (
	"embed"
	"errors"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/sqlite"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

//go:embed *.sql
var migrationsFS embed.FS

func MigrateDB(connectionURI string) error {
	d, err := iofs.New(migrationsFS, ".")
	if err != nil {
		return err
	}
	m, err := migrate.NewWithSourceInstance("iofs", d, connectionURI)
	if err != nil {
		return err
	}
	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return err
	}
	return nil
}
