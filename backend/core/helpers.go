package core

import (
	"errors"
	"strings"
	"time"

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

// Handle If-Modified-Since stuff
// Returns (need new content)
func HandleIfModifedSince(ctx echo.Context, currentLastModified time.Time) bool {
	loc, err := time.LoadLocation("GMT")
	if err != nil {
		panic("failed to load GMT timezone")
	}
	currentLastModifiedFormatted := currentLastModified.In(loc).Format(time.RFC1123)
	ctx.Response().Header().Add("Cache-Control", "private, must-revalidate, max-age=0")
	ctx.Response().Header().Add("Last-Modified", currentLastModifiedFormatted)
	if ctx.Request().Header.Get("If-Modified-Since") == currentLastModifiedFormatted {
		return false
	}
	return true
}
