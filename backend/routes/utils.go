package routes

import (
	"net/http"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/golang-jwt/jwt/v5"
	echojwt "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

const (
	AuthenticatedUserKey = "AuthenticatedUser"
	UserTokenKey         = "UserToken"
)

func authenticatedUserMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(ctx echo.Context) error {
		authenticatedUser, err := core.GetAuthenticatedUserFromContext(ctx)
		if err != nil {
			// invalid token contents
			return ctx.NoContent(http.StatusUnauthorized)
		}
		// TODO validate username & userID match in database
		ctx.Set(AuthenticatedUserKey, authenticatedUser)
		return next(ctx)
	}
}

func getAuthenticatedUser(ctx echo.Context) core.AuthenticatedUser {
	return ctx.Get(AuthenticatedUserKey).(core.AuthenticatedUser)
}

func InitRoutes(e *echo.Echo, appConfig config.AppConfig) {
	config := echojwt.Config{
		NewClaimsFunc: func(c echo.Context) jwt.Claims {
			return new(core.JWTClaims)
		},
		SigningKey: []byte(appConfig.JWTSecret),
		ContextKey: UserTokenKey,
	}
	jwtMiddleware := echojwt.WithConfig(config)

	routes := e.Group("/api/")
	{
		routes.POST("auth/token", postToken)
		routes.POST("users", postCreateUser)
		routes.GET("users/search", searchForUser)
	}
	protectedRoutes := e.Group("/api/", jwtMiddleware, authenticatedUserMiddleware)
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
		protectedRoutes.GET("notes/:noteID/content", getNoteContent)
		protectedRoutes.PUT("notes/:noteID/content", updateNoteContent, middleware.BodyLimit("1M"))
		protectedRoutes.GET("notes/:noteID/rendered", getNoteRendered)
	}
}
