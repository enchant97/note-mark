package services

import (
	"errors"

	"gorm.io/gorm"
)

var (
	NotFoundError = errors.New("not found")
	ConflictError = errors.New("conflict, already exists")
)

func dbErrorToServiceError(err error) error {
	if err == nil {
		return nil
	} else if errors.Is(err, gorm.ErrRecordNotFound) {
		return errors.Join(err, NotFoundError)
	} else if errors.Is(err, gorm.ErrDuplicatedKey) {
		return errors.Join(err, ConflictError)
	} else {
		return err
	}
}
