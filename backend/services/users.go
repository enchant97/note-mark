package services

import (
	"context"

	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
)

type UsersService struct {
	dao                       *db.DAO
	enableInternalSignup      bool
	enableInternalLogin       bool
	enableAnonymousUserSearch bool
}

func (s UsersService) New(
	dao *db.DAO,
	enableInternalSignup bool,
	enableInternalLogin bool,
	enableAnonymousUserSearch bool,
) UsersService {
	return UsersService{
		dao:                       dao,
		enableInternalSignup:      enableInternalSignup,
		enableInternalLogin:       enableInternalLogin,
		enableAnonymousUserSearch: enableAnonymousUserSearch,
	}
}

func (s *UsersService) CreateUserWithPassword(toCreate core.CreateUser) (core.User, error) {
	if !s.enableInternalSignup {
		return core.User{}, core.ErrFeatureDisabled
	}
	v, err := core.WrapDbErrorWithValue(
		s.dao.Queries.InsertUserWithPassword(
			context.Background(),
			db.InsertUserWithPasswordParams{
				Uid:          core.MustNewUID(),
				Username:     toCreate.Username,
				Name:         core.StringPtrToNullString(toCreate.Name),
				PasswordHash: core.HashPassword(toCreate.Password),
			},
		))
	if err != nil {
		return core.User{}, err
	}
	return core.User{
		ModTime: core.ModTime{
			CreatedAt: v.CreatedAt,
			UpdatedAt: v.UpdatedAt,
		},
		Uid:      v.Uid,
		Username: v.Username,
		Name:     core.NullStringToStringPtr(v.Name),
	}, nil
}

func (s *UsersService) GetUserByUsername(username string) (core.User, error) {
	v, err := core.WrapDbErrorWithValue(
		s.dao.Queries.GetUserByUsername(
			context.Background(),
			username,
		))
	if err != nil {
		return core.User{}, err
	}
	return core.User{
		ModTime: core.ModTime{
			CreatedAt: v.CreatedAt,
			UpdatedAt: v.UpdatedAt,
		},
		Uid:      v.Uid,
		Username: v.Username,
		Name:     core.NullStringToStringPtr(v.Name),
	}, nil
}

func (s *UsersService) UpdateUserByUsername(username string, toUpdate core.UpdateUser) error {
	return core.WrapDbError(s.dao.Queries.UpdateUser(context.Background(), db.UpdateUserParams{
		Username: username,
		Name:     core.StringPtrToNullString(toUpdate.Name),
	}))
}

func (s *UsersService) UpdateUserPasswordByUsername(
	username string,
	v core.UpdateUserPassword,
) error {
	if !s.enableInternalLogin {
		return core.ErrFeatureDisabled
	}
	actualPasswordHash, err := core.WrapDbErrorWithValue(
		s.dao.Queries.GetUserPassword(
			context.Background(),
			username,
		))
	if err != nil {
		return err
	}
	if ok := core.DoesPasswordMatchHashed(v.ExistingPassword, actualPasswordHash); !ok {
		return core.ErrInvalidCredentials
	}
	return core.WrapDbError(
		s.dao.Queries.UpdateUserPasswordByUsername(
			context.Background(),
			db.UpdateUserPasswordByUsernameParams{
				Username:     username,
				PasswordHash: core.HashPassword(v.NewPassword),
			}),
	)
}

func (s *UsersService) GetUsernameSearch(username string) ([]string, error) {
	if !s.enableAnonymousUserSearch {
		return nil, core.ErrFeatureDisabled
	}
	return core.WrapDbErrorWithValue(
		s.dao.Queries.GetUsernamesLike(
			context.Background(),
			username+"%"))
}
