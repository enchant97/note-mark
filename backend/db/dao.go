package db

import (
	"database/sql"
)

type DAO struct {
	DB      *sql.DB
	Queries *Queries
}

func (dao DAO) New(db *sql.DB, queries *Queries) DAO {
	return DAO{
		DB:      db,
		Queries: queries,
	}
}
