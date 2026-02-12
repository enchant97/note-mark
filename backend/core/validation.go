package core

import (
	"regexp"
)

var (
	validUsernameRegex = regexp.MustCompile(`[a-zA-Z0-9]+`)
	validFullSlugRegex = regexp.MustCompile(`^[a-z0-9-]+(?:\/[a-z0-9-]+)*(?:\.[a-z0-9-]+)*$`)
)

func IsValidUsername(v string) bool {
	return validUsernameRegex.Match([]byte(v))
}

func IsValidFullSlug(v string) bool {
	return validFullSlugRegex.Match([]byte(v))
}
