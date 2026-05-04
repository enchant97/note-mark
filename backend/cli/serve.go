package cli

import (
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/handlers"
	"github.com/enchant97/note-mark/backend/tree"
	"github.com/go-playground/validator/v10"
)

func commandServe(
	logger *slog.Logger,
	validate *validator.Validate,
	appConfig config.AppConfig,
	dao *db.DAO,
	tc *tree.TreeController,
) error {
	if mux, err := handlers.SetupHandlers(
		logger,
		validate,
		appConfig,
		dao,
		tc,
	); err != nil {
		return err
	} else {
		// Start server
		if appConfig.Bind.UnixSocket == "" {
			slog.Info(fmt.Sprintf("Serving on http://%s", appConfig.Bind.AsAddress()))
			return http.ListenAndServe(appConfig.Bind.AsAddress(), mux)
		} else {
			slog.Info(fmt.Sprintf("Serving on %s", appConfig.Bind.UnixSocket))
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
