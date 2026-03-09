package core

import (
	"path"
	"regexp"
	"strings"
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

// Validate if node's full slug is valid for given nodeType.
//
// - Slug is valid
// - FileNode is not in a AssetNode
// - AssetNode is not NoteNode
// - AssetNode has a parent
func IsValidNodeSlug(fullSlug string, nodeType NodeType) bool {
	// basic validation check
	if !IsValidFullSlug(fullSlug) {
		return false
	}
	// detailed check for specific node type
	slugExt := path.Ext(fullSlug)
	if nodeType == NoteNode && slugExt != "" {
		return false
	}
	if nodeType == AssetNode {
		if slugExt == "" {
			return false
		}
		slugSplit := strings.SplitN(fullSlug, "/", 2)
		if len(slugSplit) == 1 {
			return false
		}
	}
	return true
}
