package cli

import (
	"fmt"
	"strings"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/db"
)

func commandUserAdd(appConfig config.AppConfig, username string, password string) error {
	if err := db.InitDB(appConfig.DB); err != nil {
		return err
	}
	userDetails := db.CreateUser{
		Username: username,
		Password: password,
	}
	user := userDetails.IntoUser()
	if err := db.DB.Create(&user).Error; err != nil {
		return err
	}
	fmt.Printf("User '%s' created with ID '%s'", user.Username, user.ID)
	return nil
}

func commandUserRemove(appConfig config.AppConfig, username string) error {
	if err := db.InitDB(appConfig.DB); err != nil {
		return err
	}
	return db.DB.Where("username = ?", username).Delete(&db.User{}).Error
}

func commandUserSetPassword(appConfig config.AppConfig, username string, password string) error {
	if err := db.InitDB(appConfig.DB); err != nil {
		return err
	}
	var user db.User
	if err := db.DB.First(&user, "username = ?", username).Select("password").Error; err != nil {
		return err
	}
	user.SetPassword(password)
	return db.DB.Save(&user).Error
}

func commandUserRemovePassword(appConfig config.AppConfig, username string) error {
	if err := db.InitDB(appConfig.DB); err != nil {
		return err
	}
	var user db.User
	if err := db.DB.First(&user, "username = ?", username).Select("password").Error; err != nil {
		return err
	}
	user.Password = []byte("")
	return db.DB.Save(&user).Error
}

func commandUserAddOidcMapping(
	appConfig config.AppConfig,
	username string,
	userSub string,
) error {
	if err := db.InitDB(appConfig.DB); err != nil {
		return err
	}
	var user db.User
	if err := db.DB.
		First(&user, "username = ?", username).
		Error; err != nil {
		return err
	}
	OidcUser := db.OidcUser{
		UserID:       user.ID,
		UserSub:      userSub,
		ProviderName: strings.ToLower(appConfig.OIDC.ProviderName),
	}
	return db.DB.Create(&OidcUser).Error
}
