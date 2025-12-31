package main

import (
	"database/sql"
	"fmt"

	//"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/db/migrations"
)

func main() {
	if err := migrations.MigrateDB("sqlite://db.sqlite"); err != nil {
		panic(err)
	}
	dbConn, err := sql.Open("sqlite", "/db.sqlite")
	if err != nil {
		panic(err)
	}

	//dbQueries := db.New(dbConn)

	fmt.Println(dbConn.Stats())
}
