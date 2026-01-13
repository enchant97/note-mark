package handlers

import (
	"errors"
	"net/http"
	"os"
	"strings"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humachi"
	"github.com/enchant97/note-mark/backend/config"
	core_middleware "github.com/enchant97/note-mark/backend/middleware"
	"github.com/enchant97/note-mark/backend/storage"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func SetupHandlers(
	appConfig config.AppConfig,
	storage_backend storage.StorageController) (http.Handler, error) {
	mux := chi.NewRouter()
	mux.Use(func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Server", "note-mark")
			h.ServeHTTP(w, r)
		})
	})
	mux.Use(middleware.Logger)
	mux.Use(middleware.Heartbeat("/heartbeat"))
	mux.Use(middleware.Recoverer)
	mux.Use(cors.Handler(cors.Options{
		OptionsPassthrough: false,
		AllowedOrigins:     []string{appConfig.PublicUrl},
		AllowedMethods:     []string{"HEAD", "GET", "POST", "PATCH", "PUT", "DELETE"},
		AllowedHeaders:     []string{"*"},
		ExposedHeaders:     []string{"Date"},
		AllowCredentials:   true,
	}))
	config := huma.DefaultConfig("Note Mark - API", "0")
	config.DocsPath = "/api/docs"
	config.OpenAPIPath = "/api/openapi"
	api := humachi.New(mux, config)
	authProvider := core_middleware.AuthDetailsProvider{}.New(
		api,
		appConfig.JWTSecret,
		strings.HasPrefix(appConfig.PublicUrl, "https://"),
	)
	api.UseMiddleware(authProvider.ProviderMiddleware)
	SetupMiscHandler(api, appConfig)
	SetupAuthHandler(api, appConfig, authProvider)
	SetupUsersHandler(api, appConfig, authProvider)
	SetupBooksHandler(api, authProvider)
	SetupNotesHandler(api, appConfig, storage_backend, authProvider)
	SetupAssetsHandler(api, appConfig, storage_backend, authProvider)
	if len(appConfig.StaticPath) != 0 {
		if _, err := os.Stat(appConfig.StaticPath); errors.Is(err, os.ErrNotExist) {
			return nil, err
		}
		mux.HandleFunc("/*", core_middleware.SPAMiddleware(http.Dir(appConfig.StaticPath)))
	}
	return mux, nil
}
