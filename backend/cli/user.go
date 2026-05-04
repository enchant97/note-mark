package cli

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/enchant97/note-mark/backend/config"
	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/tree"
)

func commandUserAdd(
	dao *db.DAO,
	tc *tree.TreeController,
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
		if err := tc.RegisterNewUser(core.Username(username)); err != nil && !errors.Is(err, core.ErrConflict) {
			return err
		}
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
