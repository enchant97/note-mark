package cli

import (
	"context"
	"fmt"
	"strings"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
)

func commandUserAdd(
	dao *db.DAO,
	username string,
	password string,
) error {
	if uid, err := dao.Queries.InsertUserWithPassword(
		context.Background(),
		db.InsertUserWithPasswordParams{
			Uid:          core.MustNewUID(),
			Username:     username,
			PasswordHash: core.HashPassword(password),
		}); err != nil {
		return err
	} else {
		fmt.Printf("User '%s' created with ID '%s'", username, uid)
		return nil
	}
}

func commandUserRemove(
	dao *db.DAO,
	username string,
) error {
	return dao.Queries.MarkUserAsDeletedByUsername(context.Background(), username)
}

func commandUserSetPassword(
	dao *db.DAO,
	username string,
	password string,
) error {
	return dao.Queries.UpdateUserPasswordByUsername(
		context.Background(),
		db.UpdateUserPasswordByUsernameParams{
			Username:     username,
			PasswordHash: core.HashPassword(password),
		})
}

func commandUserRemovePassword(
	dao *db.DAO,
	username string,
) error {
	return dao.Queries.AdminRemoveUserPassword(
		context.Background(),
		username,
	)
}

func commandUserAddOidcMapping(
	appConfig config.AppConfig,
	dao *db.DAO,
	username string,
	userSub string,
) error {
	return dao.Queries.InsertOidcUserMapping(
		context.Background(),
		db.InsertOidcUserMappingParams{
			Username:     username,
			UserSub:      userSub,
			ProviderName: strings.ToLower(appConfig.OIDC.ProviderName),
		})
}
