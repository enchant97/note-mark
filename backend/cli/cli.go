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
	"github.com/enchant97/note-mark/backend/storage"
	"github.com/enchant97/note-mark/backend/tree"
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
	sc, err := storage.DiskStorageController{}.New(filepath.Join(appConfig.DataPath, "notes"))
	if err != nil {
		return err
	}
	tc := tree.TreeController{}.New(&sc, &dao)
	if err := tc.Load(); err != nil {
		return err
	}
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
					return commandServe(appConfig, &dao, &tc)
				},
			},
			{
				Name:  "clear-cache",
				Usage: "clear the tree cache",
				Description: "clear cache can be used when note data is changed from outside" +
					" of Note Mark (like when importing notes). " +
					"Any instances of Note Mark will need to be restarted" +
					" before this is taken into effect.",
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name:     "username",
						Aliases:  []string{"u"},
						Required: false,
						Usage:    "clear a specific users tree cache",
					},
				},
				Action: func(ctx context.Context, cmd *cli.Command) error {
					username := cmd.String("username")
					if username == "" {
						return dao.Queries.DeleteTreeCacheEntries(context.Background())
					}
					return dao.Queries.DeleteTreeCacheEntry(context.Background(), username)
				},
			},
			{
				Name:  "clean",
				Usage: "permanently removes users marked for deletion",
				Action: func(ctx context.Context, cmd *cli.Command) error {
					return commandClean(&dao, &sc)
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
							return commandUserAdd(&dao, username, password)
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
							return commandUserRemove(&dao, username)
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
							return commandUserSetPassword(&dao, username, password)
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
							return commandUserRemovePassword(&dao, username)
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
