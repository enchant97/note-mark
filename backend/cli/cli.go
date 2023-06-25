package cli

import (
	"log"
	"os"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/urfave/cli/v2"
)

func Entrypoint(appVersion string) error {
	// Parse config
	var appConfig config.AppConfig
	if err := appConfig.ParseConfig(); err != nil {
		log.Fatalln(err)
	}

	app := &cli.App{
        Version: appVersion,
        Usage: "Backend API app for Note Mark",
        EnableBashCompletion: true,
		Commands: []*cli.Command{
			{
				Name:  "serve",
				Usage: "run the api server",
				Action: func(ctx *cli.Context) error {
					return command_serve(appConfig)
				},
			},
		},
	}

	return app.Run(os.Args)
}
