package services

import (
	"errors"
	"time"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
)

var AuthServiceInvalidCredentialsError = errors.New("invalid username or password")

type AuthService struct{}

func (s AuthService) GetAccessToken(appConfig config.AppConfig, username string, password string) (core.AccessToken, error) {
	var user db.User
	if err := db.DB.
		First(&user, "username = ?", username).
		Select("id", "password").Error; err != nil {
		return core.AccessToken{}, AuthServiceInvalidCredentialsError
	}

	if !user.IsPasswordMatch(password) {
		return core.AccessToken{}, AuthServiceInvalidCredentialsError
	}

	authenticationData := core.AuthenticatedUser{
		UserID: user.ID,
	}

	// user is valid, create a token
	if token, err := core.CreateAuthenticationToken(
		authenticationData,
		appConfig.JWTSecret,
		time.Duration(int64(time.Second)*appConfig.TokenExpiry),
	); err != nil {
		return core.AccessToken{}, err
	} else {
		return token, nil
	}
}
