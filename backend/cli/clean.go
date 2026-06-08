package cli

import (
	"context"
	"database/sql"
	"log/slog"

	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/storage"
	"github.com/enchant97/note-mark/backend/tree"
	"golang.org/x/sync/errgroup"
)

func commandCleanUsers(dao *db.DAO, sc storage.StorageController) error {
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
				slog.Info("delete user", "username", user.Username)
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

func commandCleanTrash(
	sc storage.StorageController,
	tree tree.TreeController,
) error {
	return sc.DiscoverUsers(func(username core.Username) error {
		slog.Info("delete trash for user", "username", username)
		return tree.DeleteNode(username, ".trash")
	})
}
