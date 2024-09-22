package services

import (
	"errors"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/google/uuid"
)

var UsersServiceUserSignupDisabledError = errors.New("user sign-up disabled")
var UsersServiceUserPasswordInvalid = errors.New("user password invalid")

type UsersService struct{}

func (s UsersService) CreateUser(appConfig config.AppConfig, toCreate db.CreateUser) (db.User, error) {
	if !appConfig.AllowSignup {
		return db.User{}, UsersServiceUserSignupDisabledError
	}
	user := toCreate.IntoUser()
	return user, db.DB.Create(&user).Error
}

func (s UsersService) GetUserProfileByID(userID uuid.UUID) (db.User, error) {
	var user db.User
	return user, db.DB.First(&user, "id = ?", userID).Error
}

func (s UsersService) GetUserByUsername(
	currentUserID *uuid.UUID,
	username string,
	getBooks bool,
	getNotes bool) (db.User, error) {
	query := db.DB

	if getBooks || getNotes {
		query = query.Preload("Books", "owner_id = ? OR is_public = ?", currentUserID, true)
	}

	if getNotes {
		query = query.Preload("Books.Notes")
	}

	var user db.User
	return user, query.First(&user, "username = ?", username).Error
}

func (s UsersService) UpdateUserProfile(userID uuid.UUID, input db.UpdateUser) error {
	return db.DB.
		Model(&db.User{}).
		Where("id = ?", userID).
		Updates(input).
		Error
}

func (s UsersService) UpdateUserPassword(userID uuid.UUID, input db.UpdateUserPassword) error {
	var user db.User
	if err := db.DB.
		First(&user, "id = ?", userID).
		Select("password").
		Error; err != nil {
		return err
	}

	if !user.IsPasswordMatch(input.ExistingPassword) {
		return UsersServiceUserPasswordInvalid
	}

	user.SetPassword(input.NewPassword)

	return db.DB.Save(&user).Error
}

func (s UsersService) GetSearchForUser(username string) ([]string, error) {

	var users []string
	return users, db.DB.
		Model(&db.User{}).
		Limit(6).
		Where("username LIKE ?", username+"%").
		Pluck("username", &users).
		Error
}