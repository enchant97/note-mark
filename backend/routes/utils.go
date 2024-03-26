package routes

import (
	"errors"
	"net/http"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
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

func InitRoutes(e *echo.Echo, appConfig config.AppConfig) {
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
	apiRoutes.GET("/info", getServerInfo)
	apiRoutes.POST("/auth/token", postToken)
	slugRoutes := apiRoutes.Group("/slug/@:username")
	{
		slugRoutes.GET("", getUserByUsername)
		slugRoutes.GET("/books/:bookSlug", getBookBySlug)
		slugRoutes.GET("/books/:bookSlug/notes/:noteSlug", getNoteBySlug)
	}
	usersRoutes := apiRoutes.Group("/users")
	{
		usersRoutes.POST("", postCreateUser)
		usersRoutes.GET("/search", searchForUser)
		usersRoutes.GET("/me", getUserMe, authRequiredMiddleware)
		usersRoutes.PATCH("/me", updateUserMe, authRequiredMiddleware)
		usersRoutes.PUT("/me/password", updateUserMePassword, authRequiredMiddleware)
	}
	booksRoutes := apiRoutes.Group("/books")
	{
		booksRoutes.POST("", createBook, authRequiredMiddleware)
		booksRoutes.GET("/:bookID", getBookByID)
		booksRoutes.PATCH("/:bookID", patchBookByID, authRequiredMiddleware)
		booksRoutes.DELETE("/:bookID", deleteBookByID, authRequiredMiddleware)
		booksRoutes.GET("/:bookID/notes", getNotesByBookID)
		booksRoutes.POST("/:bookID/notes", createNoteByBookID, authRequiredMiddleware)
	}
	notesRoutes := apiRoutes.Group("/notes")
	{
		notesRoutes.GET("/recent", getNotesRecent)
		notesRoutes.GET("/:noteID", getNoteByID)
		notesRoutes.PATCH("/:noteID", patchNoteByID, authRequiredMiddleware)
		notesRoutes.DELETE("/:noteID", deleteNoteById, authRequiredMiddleware)
		notesRoutes.PUT("/:noteID/restore", restoreNoteByID, authRequiredMiddleware)
		notesRoutes.GET("/:noteID/content", getNoteContent)
		notesRoutes.PUT(
			"/:noteID/content",
			updateNoteContent,
			authRequiredMiddleware,
			middleware.BodyLimit(appConfig.NoteSizeLimit),
		)
	}
	assetsRoutes := apiRoutes.Group("/notes/:noteID/assets")
	{

		assetsRoutes.POST(
			"",
			createNoteAsset,
			authRequiredMiddleware,
			middleware.BodyLimit(appConfig.AssetSizeLimit),
		)
		assetsRoutes.GET("", getNoteAssets)
		assetsRoutes.GET("/:assetID", getNoteAssetContentByID)
		assetsRoutes.DELETE("/:assetID", deleteNoteAssetByID, authRequiredMiddleware)
	}
}
