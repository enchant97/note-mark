package routes

import (
	"errors"
	"net/http"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/golang-jwt/jwt/v5"
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
		// TODO validate username & userID match in database (if authenticatedUser is not nil)
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
		MinSupportedVersion: "0.6.0",
		AllowSignup:         appConfig.AllowSignup,
	})
}

func InitRoutes(e *echo.Echo, appConfig config.AppConfig) {
	e.Use(
		createJwtMiddleware(appConfig.JWTSecret),
		authHandlerMiddleware,
	)

	routes := e.Group("/api/")
	{
		routes.GET("info", getServerInfo)
		routes.POST("auth/token", postToken)
		routes.POST("users", postCreateUser)
		routes.GET("users/search", searchForUser)
	}
	protectedRoutes := e.Group("/api/", authRequiredMiddleware)
	{
		protectedRoutes.GET("users/me", getUserMe)
		protectedRoutes.PATCH("users/me", updateUserMe)
		protectedRoutes.PUT("users/me/password", updateUserMePassword)
		slugUserRoutes := protectedRoutes.Group("slug/@:username/")
		{
			slugUserRoutes.GET("books", getBooksByUsername)
			slugUserRoutes.GET("books/:bookSlug", getBookBySlug)
			slugUserRoutes.GET("books/:bookSlug/notes", getNotesBySlug)
			slugUserRoutes.GET("books/:bookSlug/notes/:noteSlug", getNoteBySlug)
		}
		protectedRoutes.POST("books", createBook)
		protectedRoutes.GET("books/:bookID", getBookByID)
		protectedRoutes.PATCH("books/:bookID", patchBookByID)
		protectedRoutes.DELETE("books/:bookID", deleteBookByID)
		protectedRoutes.GET("books/:bookID/notes", getNotesByBookID)
		protectedRoutes.POST("books/:bookID/notes", createNoteByBookID)
		protectedRoutes.GET("notes/:noteID", getNoteByID)
		protectedRoutes.PATCH("notes/:noteID", patchNoteByID)
		protectedRoutes.DELETE("notes/:noteID", deleteNoteById)
		protectedRoutes.PUT("notes/:noteID/restore", restoreNoteByID)
		protectedRoutes.GET("notes/:noteID/content", getNoteContent)
		protectedRoutes.PUT("notes/:noteID/content", updateNoteContent, middleware.BodyLimit("1M"))
	}
}
