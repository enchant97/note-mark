package core

import (
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
)

type AuthenticatedUser struct {
	UserID uuid.UUID `json:"userId"`
}

func (u *AuthenticatedUser) IntoClaims(expiresAt time.Time) JWTClaims {
	return JWTClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   u.UserID.String(),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}
}

type JWTClaims struct {
	jwt.RegisteredClaims
}

func (c *JWTClaims) ToAuthenticatedUser() (AuthenticatedUser, error) {
	if userID, err := uuid.Parse(c.Subject); err != nil {
		return AuthenticatedUser{}, err
	} else {
		return AuthenticatedUser{
			UserID: userID,
		}, nil
	}
}

type LoginToken struct {
	Type   string    `json:"type"`
	Token  string    `json:"token"`
	Expiry time.Time `json:"expiry"`
}

type CreateLogin struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}
