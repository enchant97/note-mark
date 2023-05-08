package core

import (
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/labstack/echo/v4"
)

// Get the authenticated user
func GetAuthenticatedUserFromContext(ctx echo.Context) (AuthenticatedUser, error) {
	userToken := ctx.Get("UserToken").(*jwt.Token)
	tokenClaims := userToken.Claims.(*JWTClaims)
	return tokenClaims.ToAuthenticatedUser()
}

// Create token for authentication
func CreateAuthenticationToken(user AuthenticatedUser, secretKey []byte) (LoginToken, error) {
	expiresAt := time.Now().Add(time.Hour * 72)
	claims := user.IntoClaims(expiresAt)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	rawToken, err := token.SignedString(secretKey)
	if err != nil {
		return LoginToken{}, err
	}
	return LoginToken{
		Type:   "Bearer",
		Token:  rawToken,
		Expiry: expiresAt,
	}, nil
}
