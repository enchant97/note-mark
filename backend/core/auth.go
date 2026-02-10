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

type PasswordGrant struct {
	Username string `json:"username" required:"false" validate:"required"`
	Password string `json:"password" required:"false" validate:"required"`
}

type TokenExchangeGrant struct {
	Resource           string `json:"resource,omitempty"`
	Audience           string `json:"audience,omitempty"`
	Scope              string `json:"scope,omitempty"`
	RequestedTokenType string `json:"requested_token_type,omitempty"`
	SubjectToken       string `json:"subject_token" required:"false" validate:"required"`
	SubjectTokenType   string `json:"subject_token_type" required:"false" validate:"eq=urn:ietf:params:oauth:token-type:access_token"`
	ActorToken         string `json:"actor_token,omitempty" validate:"require_with=ActorTokenType"`
	ActorTokenType     string `json:"actor_token_type,omitempty" validate:"require_with=ActorToken,eq=urn:ietf:params:oauth:token-type:id_token"`
}

// OAuth2.0 Access Token Request, following: RFC6749 + RFC8693
type AccessTokenRequest struct {
	GrantType          string `json:"grant_type" validate:"oneof=password urn:ietf:params:oauth:grant-type:token-exchange"`
	PasswordGrant      `validate:"required_if=GrantType password,dive"`
	TokenExchangeGrant `validate:"required_if=GrantType urn:ietf:params:oauth:grant-type:token-exchange,dive"`
}

// OpenID UserInfo Response
type UserInfoResponse struct {
	Sub               string  `json:"sub"`
	Name              *string `json:"name,omitempty"`
	PreferredUsername string  `json:"preferred_username"`
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
