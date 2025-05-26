package cli

import (
	"errors"
	"os"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/urfave/cli/v2"
)

func Entrypoint(appVersion string) error {
	// Parse config
	var appConfig config.AppConfig
	if err := appConfig.ParseConfig(); err != nil {
		return err
	}

	app := &cli.App{
		Version:              appVersion,
		Usage:                "Backend API app for Note Mark",
		EnableBashCompletion: true,
		Commands: []*cli.Command{
			{
				Name:  "serve",
				Usage: "run the api server",
				Action: func(ctx *cli.Context) error {
					return commandServe(appConfig)
				},
			},
			{
				Name:  "clean",
				Usage: "cleans deleted and unused data",
				Action: func(ctx *cli.Context) error {
					return commandClean(appConfig)
				},
			},
			{
				Name:  "user",
				Usage: "user management",
				Subcommands: []*cli.Command{
					{
						Name:  "add",
						Usage: "add a new user",
						Flags: []cli.Flag{
							&cli.StringFlag{Name: "username", Aliases: []string{"u"}, Required: true},
							&cli.StringFlag{Name: "password", Aliases: []string{"p"}, Required: true},
						},
						Action: func(ctx *cli.Context) error {
							username := ctx.String("username")
							password := ctx.String("password")
							return commandUserAdd(appConfig, username, password)
						},
					},
					{
						Name:  "remove",
						Usage: "remove a existing user",
						Flags: []cli.Flag{
							&cli.StringFlag{Name: "username", Aliases: []string{"u"}, Required: true},
						},
						Action: func(ctx *cli.Context) error {
							username := ctx.String("username")
							return commandUserRemove(appConfig, username)
						},
					},
					{
						Name:  "set-password",
						Usage: "set a existing users password",
						Flags: []cli.Flag{
							&cli.StringFlag{Name: "username", Aliases: []string{"u"}, Required: true},
							&cli.StringFlag{Name: "password", Aliases: []string{"p"}, Required: true},
						},
						Action: func(ctx *cli.Context) error {
							username := ctx.String("username")
							password := ctx.String("password")
							return commandUserSetPassword(appConfig, username, password)
						},
					},
					{
						Name:  "remove-password",
						Usage: "remove a existing users password",
						Flags: []cli.Flag{
							&cli.StringFlag{Name: "username", Aliases: []string{"u"}, Required: true},
						},
						Action: func(ctx *cli.Context) error {
							username := ctx.String("username")
							return commandUserRemovePassword(appConfig, username)
						},
					},
					{
						Name:  "add-oidc-mapping",
						Usage: "set a existing users oidc mapping",
						Flags: []cli.Flag{
							&cli.StringFlag{Name: "username", Required: true},
							&cli.StringFlag{Name: "user-sub", Required: true},
						},
						Action: func(ctx *cli.Context) error {
							username := ctx.String("username")
							userSub := ctx.String("user-sub")
							return commandUserAddOidcMapping(appConfig, username, userSub)
						},
					},
				},
			},
			{
				Name:  "migrate",
				Usage: "import and export data out of the app",
				Subcommands: []*cli.Command{
					{
						Name:    "import",
						Aliases: []string{"i"},
						Usage:   "import data into the app",
						Flags: []cli.Flag{
							&cli.StringFlag{Name: "import-dir", Aliases: []string{"d"}, Required: true},
						},
						Action: func(ctx *cli.Context) error {
							importDir := ctx.String("import-dir")
							if _, err := os.Stat(importDir); errors.Is(err, os.ErrNotExist) {
								return cli.Exit("import-dir does not exist, or has no read permissions", 1)
							}
							return commandMigrateImportData(appConfig, importDir)
						},
					},
					{
						Name:    "export",
						Aliases: []string{"e"},
						Usage:   "export data from the app",
						Flags: []cli.Flag{
							&cli.StringFlag{Name: "export-dir", Aliases: []string{"d"}, Required: true},
						},
						Action: func(ctx *cli.Context) error {
							exportDir := ctx.String("export-dir")
							return commandMigrateExportData(appConfig, exportDir)
						},
					},
				},
			},
		},
	}

	return app.Run(os.Args)
}
