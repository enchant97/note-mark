package cli

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/db/migrations"
	"github.com/urfave/cli/v3"
)

func Entrypoint(appVersion string) error {
	// Parse config
	var appConfig config.AppConfig
	if err := appConfig.ParseConfig(); err != nil {
		return err
	}
	// Setup DB
	dbPath := filepath.Join(appConfig.DataPath, "db.sqlite")
	if err := migrations.MigrateDB(fmt.Sprintf("sqlite://%s", dbPath)); err != nil {
		return err
	}
	dbConn, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return err
	}
	dao := db.DAO{}.New(dbConn, db.New(dbConn))

	// Do CLI
	app := &cli.Command{
		Version:               appVersion,
		Usage:                 "Backend API app for Note Mark",
		EnableShellCompletion: true,
		Commands: []*cli.Command{
			{
				Name:  "serve",
				Usage: "run the api server",
				Action: func(ctx context.Context, cmd *cli.Command) error {
					return commandServe()
				},
			},
			{
				Name:  "clean",
				Usage: "permanently removes users marked for deletion",
				Action: func(ctx context.Context, cmd *cli.Command) error {
					return commandClean()
				},
			},
			{
				Name:  "user",
				Usage: "user management",
				Commands: []*cli.Command{
					{
						Name:  "add",
						Usage: "add a new user",
						Flags: []cli.Flag{
							&cli.StringFlag{Name: "username", Aliases: []string{"u"}, Required: true},
							&cli.StringFlag{Name: "password", Aliases: []string{"p"}, Required: true},
						},
						Action: func(ctx context.Context, cmd *cli.Command) error {
							username := cmd.String("username")
							password := cmd.String("password")
							return commandUserAdd(appConfig, &dao, username, password)
						},
					},
					{
						Name:  "remove",
						Usage: "remove a existing user",
						Flags: []cli.Flag{
							&cli.StringFlag{Name: "username", Aliases: []string{"u"}, Required: true},
						},
						Action: func(ctx context.Context, cmd *cli.Command) error {
							username := cmd.String("username")
							return commandUserRemove(appConfig, &dao, username)
						},
					},
					{
						Name:  "set-password",
						Usage: "set a existing users password",
						Flags: []cli.Flag{
							&cli.StringFlag{Name: "username", Aliases: []string{"u"}, Required: true},
							&cli.StringFlag{Name: "password", Aliases: []string{"p"}, Required: true},
						},
						Action: func(ctx context.Context, cmd *cli.Command) error {
							username := cmd.String("username")
							password := cmd.String("password")
							return commandUserSetPassword(appConfig, &dao, username, password)
						},
					},
					{
						Name:  "remove-password",
						Usage: "remove a existing users password",
						Flags: []cli.Flag{
							&cli.StringFlag{Name: "username", Aliases: []string{"u"}, Required: true},
						},
						Action: func(ctx context.Context, cmd *cli.Command) error {
							username := cmd.String("username")
							return commandUserRemovePassword(appConfig, &dao, username)
						},
					},
					{
						Name:  "add-oidc-mapping",
						Usage: "set a existing users oidc mapping",
						Flags: []cli.Flag{
							&cli.StringFlag{Name: "username", Required: true},
							&cli.StringFlag{Name: "user-sub", Required: true},
						},
						Action: func(ctx context.Context, cmd *cli.Command) error {
							username := cmd.String("username")
							userSub := cmd.String("user-sub")
							return commandUserAddOidcMapping(appConfig, &dao, username, userSub)
						},
					},
				},
			},
		},
	}
	return app.Run(context.Background(), os.Args)
}
