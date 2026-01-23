package core

import (
	"errors"
	"log"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var (
	JWTClaimsNotValidError  = errors.New("invalid jwt claims")
	DefaultJwtSigningMethod = jwt.SigningMethodHS256
)

type AuthenticatedUser struct {
	UserUID  uuid.UUID
	Username string
}

func (u *AuthenticatedUser) IntoClaims(expiresAt time.Time) JWTClaims {
	return JWTClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   u.UserUID.String(),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}
}

type JWTClaims struct {
	jwt.RegisteredClaims
}

func (c *JWTClaims) GetUserUID() (uuid.UUID, error) {
	if userID, err := uuid.Parse(c.Subject); err != nil {
		return uuid.Nil, err
	} else {
		return userID, nil
	}
}

// OAuth2.0 Access Token, following: RFC6750 & RFC6749
type AccessToken struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   uint   `json:"expires_in"`
}

// OAuth2.0 Access Token Request, following: RFC6749
//
// only supporting 'Resource Owner Password Flow'
type AccessTokenRequest struct {
	GrantType string `json:"grant_type" query:"grant_type" form:"grant_type" required:"true" enum:"password"`
	Username  string `json:"username" query:"username" form:"username" required:"true"`
	Password  string `json:"password" query:"password" form:"password" required:"true"`
}

// Create token for authentication
func CreateAuthenticationToken(
	user AuthenticatedUser,
	secretKey []byte,
	expiresDuration time.Duration,
) (AccessToken, error) {
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
func ParseAuthenticationToken(tokenString string, secretKey []byte) (uuid.UUID, error) {
	if token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(t *jwt.Token) (any, error) {
		return secretKey, nil
	},
		jwt.WithValidMethods([]string{DefaultJwtSigningMethod.Alg()}),
		jwt.WithExpirationRequired()); err != nil {
		return uuid.Nil, err
	} else {
		if claims, ok := token.Claims.(*JWTClaims); !ok {
			return uuid.Nil, JWTClaimsNotValidError
		} else {
			return claims.GetUserUID()
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

func (a *AuthenticationDetails) MustGetAuthenticatedUser() AuthenticatedUser {
	if a.user == nil {
		log.Panicln("no authentication has been set")
	}
	return *a.user
}

func (a *AuthenticationDetails) GetOptionalAuthenticatedUser() *AuthenticatedUser {
	return a.user
}

func (a *AuthenticationDetails) GetOptionalUserUID() *uuid.UUID {
	if a.user == nil {
		return nil
	}
	return &a.user.UserUID
}
