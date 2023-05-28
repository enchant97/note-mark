package core

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

// Get the authenticated user
func GetAuthenticatedUserFromContext(ctx echo.Context) (AuthenticatedUser, error) {
	userToken := ctx.Get("UserToken").(*jwt.Token)
	tokenClaims := userToken.Claims.(*JWTClaims)
	return tokenClaims.ToAuthenticatedUser()
}

// Create token for authentication
func CreateAuthenticationToken(user AuthenticatedUser, secretKey []byte, expiresDuration time.Duration) (AccessToken, error) {
	expiresAt := time.Now().Add(expiresDuration)
	claims := user.IntoClaims(expiresAt)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	rawToken, err := token.SignedString(secretKey)
	if err != nil {
		return AccessToken{}, err
	}
	return AccessToken{
		AccessToken: rawToken,
		TokenType:   "Bearer",
		ExpiresIn:   uint(expiresDuration.Seconds()),
	}, nil
}
