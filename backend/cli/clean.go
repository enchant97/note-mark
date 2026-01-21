package cli

import (
	"context"
	"database/sql"

	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/storage"
	"golang.org/x/sync/errgroup"
)

func commandClean(dao *db.DAO, sc storage.StorageController) error {
	for {
		users, err := dao.Queries.AdminGetDeletedUsers(context.Background(), 4)
		if err != nil {
			return err
		}
		if len(users) == 0 {
			return nil
		}
		var wg errgroup.Group
		for _, user := range users {
			wg.Go(func() error {
				tx, err := dao.DB.BeginTx(context.Background(), &sql.TxOptions{})
				if err != nil {
					return err
				}
				q := dao.Queries.WithTx(tx)
				defer tx.Rollback()
				if err := q.AdminDeleteUser(context.Background(), user.Uid); err != nil {
					return err
				}
				if err := sc.DeleteUser(core.Username(user.Username)); err != nil {
					return err
				}
				return tx.Commit()
			})
		}
		if err := wg.Wait(); err != nil {
			return err
		}
	}
}
