package core

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var (
	JWTClaimsNotValidError  = errors.New("invalid jwt claims")
	DefaultJwtSigningMethod = jwt.SigningMethodHS256
)

// Create token for authentication
func CreateAuthenticationToken(user AuthenticatedUser, secretKey []byte, expiresDuration time.Duration) (AccessToken, error) {
	expiresAt := time.Now().Add(expiresDuration)
	claims := user.IntoClaims(expiresAt)
	token := jwt.NewWithClaims(DefaultJwtSigningMethod, claims)
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

// Parse a token and convert into a authenticated user
func ParseAuthenticationToken(tokenString string, secretKey []byte) (AuthenticatedUser, error) {
	if token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(t *jwt.Token) (interface{}, error) {
		return secretKey, nil
	},
		jwt.WithValidMethods([]string{DefaultJwtSigningMethod.Alg()}),
		jwt.WithExpirationRequired()); err != nil {
		return AuthenticatedUser{}, err
	} else {
		if claims, ok := token.Claims.(*JWTClaims); !ok {
			return AuthenticatedUser{}, JWTClaimsNotValidError
		} else {
			return claims.ToAuthenticatedUser()
		}
	}
}

type AuthenticationDetails struct {
	user *AuthenticatedUser
}

func (a AuthenticationDetails) New(user *AuthenticatedUser) AuthenticationDetails {
	a = AuthenticationDetails{
		user: user,
	}
	return a
}

func (a *AuthenticationDetails) IsAuthenticated() bool {
	return a.user != nil
}

func (a *AuthenticationDetails) GetAuthenticatedUser() AuthenticatedUser {
	if a.user == nil {
		panic("no authentication has been set")
	}
	return *a.user
}

func (a *AuthenticationDetails) GetOptionalAuthenticatedUser() *AuthenticatedUser {
	return a.user
}

func (a *AuthenticationDetails) GetOptionalUserID() *uuid.UUID {
	if a.user == nil {
		return nil
	}
	return &a.user.UserID
}
