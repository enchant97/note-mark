package cli

import (
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
				},
			},
		},
	}

	return app.Run(os.Args)
}
