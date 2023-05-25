package core

import (
	"errors"

	"github.com/labstack/echo/v4"
)

// Ease of use method, when binding & validation is needed.
func BindAndValidate(ctx echo.Context, i interface{}) error {
	if err := ctx.Bind(i); err != nil {
		return errors.Join(BindError, err)
	} else if err := ctx.Validate(i); err != nil {
		return errors.Join(ValidationError, err)
	}
	return nil
}
