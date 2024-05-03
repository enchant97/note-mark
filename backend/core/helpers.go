package core

import (
	"errors"
	"os"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
)

// / Check whether directory is empty.
// / Will return true if directory does not exist.
func IsDirEmpty(name string) bool {
	if files, err := os.ReadDir(name); err == nil && len(files) != 0 {
		return false
	}
	return true
}

// Ease of use method, when binding & validation is needed.
func BindAndValidate(ctx echo.Context, i interface{}) error {
	if err := ctx.Bind(i); err != nil {
		return errors.Join(ErrBind, err)
	} else if err := ctx.Validate(i); err != nil {
		return errors.Join(ErrValidation, err)
	}
	return nil
}

func TimeIntoHTTPFormat(t time.Time) string {
	if loc, err := time.LoadLocation("GMT"); err != nil {
		panic("failed to load GMT timezone")
	} else {
		return t.In(loc).Format(time.RFC1123)
	}
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
	currentLastModifiedFormatted := TimeIntoHTTPFormat(currentLastModified)
	ctx.Response().Header().Add("Cache-Control", "private, must-revalidate, max-age=0")
	ctx.Response().Header().Add("Last-Modified", currentLastModifiedFormatted)
	if ctx.Request().Header.Get("If-Modified-Since") == currentLastModifiedFormatted {
		return false
	}
	return true
}
