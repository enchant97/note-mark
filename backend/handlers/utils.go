package handlers

import (
	"errors"
	"net/http"
	"os"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/storage"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	echojwt "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gorm.io/gorm"
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

// HTTP error handler, to handle unexpected errors
func httpErrorHandler(err error, ctx echo.Context) {
	if e, ok := err.(*echo.HTTPError); ok {
		// normal HTTP error
		ctx.JSON(e.Code, e.Message)
		return
	}
	ctx.Logger().Error(err)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		ctx.NoContent(http.StatusNotFound)
	} else if errors.Is(err, gorm.ErrDuplicatedKey) {
		ctx.NoContent(http.StatusConflict)
	} else if errors.Is(err, core.ErrBind) || errors.Is(err, core.ErrValidation) {
		ctx.NoContent(http.StatusUnprocessableEntity)
	} else {
		ctx.NoContent(http.StatusInternalServerError)
	}
}

func SetupHandlers(
	appConfig config.AppConfig,
	storage_backend storage.StorageController) (*echo.Echo, error) {
	// Create server
	e := echo.New()
	e.HTTPErrorHandler = httpErrorHandler
	// Register root middleware
	e.Use(middleware.Recover())
	e.Use(middleware.Logger())
	v := core.Validator{}.New()
	e.Validator = &v
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
			return nil, err
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
	SetupMiscHandler(apiRoutes, appConfig)
	SetupAuthHandler(apiRoutes, appConfig)
	SetupUsersHandler(apiRoutes, appConfig)
	SetupBooksHandler(apiRoutes)
	SetupNotesHandler(apiRoutes, appConfig, storage_backend)
	SetupAssetsHandler(apiRoutes, appConfig, storage_backend)
	return e, nil
}
