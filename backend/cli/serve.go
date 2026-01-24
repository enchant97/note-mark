package cli

import (
	"fmt"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/handlers"
)

func commandServe(appConfig config.AppConfig, dao *db.DAO) error {
	if mux, err := handlers.SetupHandlers(appConfig, dao); err != nil {
		return err
	} else {
		// Start server
		fmt.Println(`
oooo   oooo  ooooooo   ooooooooooo ooooooooooo
 8888o  88 o888   888o 88  888  88  888    88
 88 888o88 888     888     888      888ooo8
 88   8888 888o   o888     888      888    oo
o88o    88   88ooo88      o888o    o888ooo8888

oooo     oooo      o      oooooooooo  oooo   oooo
 8888o   888      888      888    888  888  o88
 88 888o8 88     8  88     888oooo88   888888
 88  888  88    8oooo88    888  88o    888  88o
o88o  8  o88o o88o  o888o o888o  88o8 o888o o888o`)
		fmt.Println()
		if appConfig.Bind.UnixSocket == "" {
			fmt.Println("Serving on: http://" + appConfig.Bind.AsAddress())
			return http.ListenAndServe(appConfig.Bind.AsAddress(), mux)
		} else {
			fmt.Printf("Serving on '%s'\n", appConfig.Bind.UnixSocket)
			sock, err := net.Listen("unix", appConfig.Bind.UnixSocket)
			if err != nil {
				return err
			}
			stopChannel := make(chan os.Signal, 1)
			signal.Notify(stopChannel, os.Interrupt, syscall.SIGTERM)
			go func() {
				<-stopChannel
				os.Remove(appConfig.Bind.UnixSocket)
			}()
			return http.Serve(sock, mux)
		}
	}
}
