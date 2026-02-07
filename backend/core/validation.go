package core

import "regexp"

var validFullSlugRegex = regexp.MustCompile(`^[a-z0-9-]+(?:\/[a-z0-9-]+)*(?:\.[a-z0-9-]+)*$`)

func IsValidFullSlug(v string) bool {
	return validFullSlugRegex.Match([]byte(v))
}
