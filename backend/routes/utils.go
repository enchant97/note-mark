package routes

import (
	"errors"
	"net/http"
	"os"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/handlers"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	echojwt "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

const (
	AuthDetailsKey = "AuthDetails"
	UserTokenKey   = "UserToken"
)

// turns a JWT token into a authenticated user,
// or returns nil if no JWT is set
func jwtIntoAuthenticatedUser(ctx echo.Context) (*core.AuthenticatedUser, error) {
	userTokenData := ctx.Get(UserTokenKey)
	if userTokenData == nil {
		return nil, nil
	}
	userToken := userTokenData.(*jwt.Token)
	tokenClaims := userToken.Claims.(*core.JWTClaims)
	user, err := tokenClaims.ToAuthenticatedUser()
	return &user, err
}

func canUserAuthenticate(userID uuid.UUID) (bool, error) {
	var count int64
	err := db.DB.Model(&db.User{}).Where("id = ?", userID).Limit(1).Count(&count).Error
	return count == 1, err
}

// create JWT middleware, allowing for missing token
func createJwtMiddleware(secret []byte) echo.MiddlewareFunc {
	config := echojwt.Config{
		NewClaimsFunc: func(c echo.Context) jwt.Claims {
			return new(core.JWTClaims)
		},
		SigningKey: secret,
		ContextKey: UserTokenKey,
		ErrorHandler: func(ctx echo.Context, err error) error {
			if errors.Is(err, echojwt.ErrJWTMissing) {
				return nil
			}
			return ctx.JSON(http.StatusUnauthorized, "missing or malformed jwt")
		},
		ContinueOnIgnoredError: true,
	}
	return echojwt.WithConfig(config)
}

func authHandlerMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(ctx echo.Context) error {
		authenticatedUser, err := jwtIntoAuthenticatedUser(ctx)
		if err != nil {
			// invalid token contents
			return ctx.NoContent(http.StatusUnauthorized)
		}
		if authenticatedUser != nil {
			if allowed, err := canUserAuthenticate(authenticatedUser.UserID); err != nil {
				return err
			} else if !allowed {
				// user does not exist or is not allowed to login
				return ctx.NoContent(http.StatusUnauthorized)
			}
		}
		authDetails := core.AuthenticationDetails{}.New(authenticatedUser)
		ctx.Set(AuthDetailsKey, &authDetails)
		return next(ctx)
	}
}

func authRequiredMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(ctx echo.Context) error {
		if !ctx.Get(AuthDetailsKey).(*core.AuthenticationDetails).IsAuthenticated() {
			ctx.Response().Header().Set("WWW-Authenticate", "Bearer")
			return ctx.JSON(http.StatusUnauthorized, "authentication required")
		}
		return next(ctx)
	}
}

func getAuthDetails(ctx echo.Context) *core.AuthenticationDetails {
	return ctx.Get(AuthDetailsKey).(*core.AuthenticationDetails)
}

func getServerInfo(ctx echo.Context) error {
	appConfig := ctx.Get("AppConfig").(config.AppConfig)

	return ctx.JSON(http.StatusOK, core.ServerInfo{
		MinSupportedVersion: "0.12.0",
		AllowSignup:         appConfig.AllowSignup,
	})
}

func InitRoutes(e *echo.Echo, appConfig config.AppConfig) error {
	corsConfig := middleware.DefaultCORSConfig
	{
		corsConfig.AllowOrigins = appConfig.CORSOrigins
	}
	e.Use(
		func(next echo.HandlerFunc) echo.HandlerFunc {
			return func(c echo.Context) error {
				c.Response().Header().Add("Server", "note-mark")
				return next(c)
			}
		},
	)
	if len(appConfig.StaticPath) != 0 {
		if _, err := os.Stat(appConfig.StaticPath); errors.Is(err, os.ErrNotExist) {
			return err
		}
		e.Use(middleware.StaticWithConfig(middleware.StaticConfig{
			Root:  appConfig.StaticPath,
			HTML5: true,
		}))
		e.GET("api", func(c echo.Context) error { return c.NoContent(http.StatusNotFound) })
		e.GET("api/", func(c echo.Context) error { return c.NoContent(http.StatusNotFound) })
		e.GET("api/*", func(c echo.Context) error { return c.NoContent(http.StatusNotFound) })
	}
	apiRoutes := e.Group(
		"/api",
		middleware.CORSWithConfig(corsConfig),
		createJwtMiddleware(appConfig.JWTSecret),
		authHandlerMiddleware,
	)
	authHandler := handlers.AuthHandler{}
	userHandler := handlers.UsersHandler{}
	booksHandler := handlers.BooksHandler{}
	notesHandler := handlers.NotesHandler{}
	assetsHandler := handlers.AssetsHandler{}
	apiRoutes.POST("/auth/token", authHandler.PostToken)
	apiRoutes.GET("/info", getServerInfo)
	slugRoutes := apiRoutes.Group("/slug/@:username")
	{
		slugRoutes.GET("", userHandler.GetUserByUsername)
		slugRoutes.GET("/books/:bookSlug", booksHandler.GetBookBySlug)
		slugRoutes.GET("/books/:bookSlug/notes/:noteSlug", notesHandler.GetNoteBySlug)
	}
	usersRoutes := apiRoutes.Group("/users")
	{
		usersRoutes.POST("", userHandler.PostCreateUser)
		usersRoutes.GET("/search", userHandler.GetSearchForUser)
		usersRoutes.GET("/me", userHandler.GetCurrentUser, authRequiredMiddleware)
		usersRoutes.PATCH("/me", userHandler.PatchCurrentUser, authRequiredMiddleware)
		usersRoutes.PUT("/me/password", userHandler.PatchCurrentUserPassword, authRequiredMiddleware)
	}
	booksRoutes := apiRoutes.Group("/books")
	{
		booksRoutes.POST("", booksHandler.PostBook, authRequiredMiddleware)
		booksRoutes.GET("/:bookID", booksHandler.GetBookByID)
		booksRoutes.PATCH("/:bookID", booksHandler.PatchBookByID, authRequiredMiddleware)
		booksRoutes.DELETE("/:bookID", booksHandler.DeleteBookByID, authRequiredMiddleware)
		booksRoutes.GET("/:bookID/notes", notesHandler.GetNotesByBookID)
		booksRoutes.POST("/:bookID/notes", notesHandler.PostNoteByBookID, authRequiredMiddleware)
	}
	notesRoutes := apiRoutes.Group("/notes")
	{
		notesRoutes.GET("/recent", notesHandler.GetNotesRecent)
		notesRoutes.GET("/:noteID", notesHandler.GetNoteByID)
		notesRoutes.PATCH("/:noteID", notesHandler.PatchNoteByID, authRequiredMiddleware)
		notesRoutes.DELETE("/:noteID", notesHandler.DeleteNoteByID, authRequiredMiddleware)
		notesRoutes.PUT("/:noteID/restore", notesHandler.RestoreNoteByID, authRequiredMiddleware)
		notesRoutes.GET("/:noteID/content", notesHandler.GetNoteContentByID)
		notesRoutes.PUT(
			"/:noteID/content",
			notesHandler.UpdateNoteContentByID,
			authRequiredMiddleware,
			middleware.BodyLimit(appConfig.NoteSizeLimit),
		)
	}
	assetsRoutes := apiRoutes.Group("/notes/:noteID/assets")
	{

		assetsRoutes.POST(
			"",
			assetsHandler.PostNoteAsset,
			authRequiredMiddleware,
			middleware.BodyLimit(appConfig.AssetSizeLimit),
		)
		assetsRoutes.GET("", assetsHandler.GetNoteAssets)
		assetsRoutes.GET("/:assetID", assetsHandler.GetNoteAssetContentByID)
		assetsRoutes.DELETE("/:assetID", assetsHandler.DeleteNoteAssetByID, authRequiredMiddleware)
	}
	return nil
}
