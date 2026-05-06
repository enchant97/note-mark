package core

import (
	"database/sql"
	"errors"

	"modernc.org/sqlite"
	sqlite3 "modernc.org/sqlite/lib"
)

var ErrNotFound = errors.New("not found")
var ErrConflict = errors.New("conflict")
var ErrParsingContent = errors.New("failed to parse content")
var ErrInvalidCredentials = errors.New("invalid credentials")
var ErrFeatureDisabled = errors.New("feature is disabled")
var ErrSlugInvalid = errors.New("slug invalid")

// / wrap a database error with a specific service error
func WrapDbError(err error) error {
	if errors.Is(err, sql.ErrNoRows) {
		return errors.Join(err, ErrNotFound)
	} else if err, ok := err.(*sqlite.Error); ok {
		switch err.Code() { // find at: <https://sqlite.org/rescode.html>
		case
			sqlite3.SQLITE_CONSTRAINT_UNIQUE,     // 2067
			sqlite3.SQLITE_CONSTRAINT_PRIMARYKEY: // 1555
			return errors.Join(err, ErrConflict)
		}
	}
	return err
}

// / wrap a database error and it's potential value with a specific service error
func WrapDbErrorWithValue[T any](v T, err error) (T, error) {
	return v, WrapDbError(err)
}
