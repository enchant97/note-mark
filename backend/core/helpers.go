package core

import (
	"errors"
	"strings"

	"github.com/labstack/echo/v4"
)

// Ease of use method, when binding & validation is needed.
func BindAndValidate(ctx echo.Context, i interface{}) error {
	if err := ctx.Bind(i); err != nil {
		return errors.Join(ErrBind, err)
	} else if err := ctx.Validate(i); err != nil {
		return errors.Join(ErrValidation, err)
	}
	return nil
}

// Handle ETag stuff
// Returns (need new content)
func HandleETag(ctx echo.Context, currentETag string) bool {
	ctx.Response().Header().Add("ETag", "\""+currentETag+"\"")
	if headerValue := ctx.Request().Header.Get("If-None-Match"); headerValue != "" {
		tags := strings.Split(headerValue, ",")
		for _, tag := range tags {
			tag = strings.Trim(strings.TrimSpace(tag), "\"")
			if tag == currentETag {
				return false
			}
		}
	}
	return true
}
