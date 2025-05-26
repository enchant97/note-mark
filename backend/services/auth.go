package services

import (
	"errors"
	"time"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"gorm.io/gorm"
)

var InvalidCredentialsError = errors.New("invalid username or password")
var LoginDisabledError = errors.New("login is disabled")

type AuthService struct{}

// Generate a new access token for user,
// if username and password are valid
func (s AuthService) GetAccessToken(
	appConfig config.AppConfig,
	username string,
	password string,
) (core.AccessToken, error) {
	if !appConfig.EnableInternalLogin {
		return core.AccessToken{}, LoginDisabledError
	}
	var user db.User
	if err := db.DB.
		First(&user, "username = ?", username).
		Select("id", "password").Error; err != nil {
		return core.AccessToken{}, InvalidCredentialsError
	}

	if !user.IsPasswordMatch(password) {
		return core.AccessToken{}, InvalidCredentialsError
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

// Generate a new access token for a existing user with oidc mapping
func (s AuthService) GetAccessTokenForOidcUser(
	appConfig config.AppConfig,
	userSub string,
) (core.AccessToken, error) {
	var oidcUser db.OidcUser
	// get the oidc mapping for user
	if err := db.DB.
		First(&oidcUser, &db.OidcUser{
			UserSub:      userSub,
			ProviderName: appConfig.OIDC.ProviderName,
		}).
		Error; err != nil {
		return core.AccessToken{}, err
	}
	// user is valid, create a token
	if token, err := core.CreateAuthenticationToken(
		core.AuthenticatedUser{
			UserID: oidcUser.UserID,
		},
		appConfig.JWTSecret,
		time.Duration(int64(time.Second)*appConfig.TokenExpiry),
	); err != nil {
		return core.AccessToken{}, err
	} else {
		return token, nil
	}
}

// Tries to create a new user for the given oidc details,
// will skip if a mapping already exists under same/different username
func (s AuthService) TryCreateNewOidcUser(
	appConfig config.AppConfig,
	username string,
	userSub string,
) error {
	var oidcCount int64
	if err := db.DB.Model(&db.OidcUser{}).Where(db.OidcUser{
		UserSub:      userSub,
		ProviderName: appConfig.OIDC.ProviderName,
	}).Count(&oidcCount).Error; err != nil {
		return err
	} else if oidcCount != 0 {
		// skip user+oidc mapping as already exists
		return nil
	}
	return db.DB.Transaction(func(tx *gorm.DB) error {
		user := db.User{
			Username: username,
			Password: []byte(""),
		}
		if err := tx.Create(&user).Error; err != nil {
			return err
		}
		return tx.Create(&db.OidcUser{
			UserID:       user.ID,
			UserSub:      userSub,
			ProviderName: appConfig.OIDC.ProviderName,
		}).Error
	})
}
