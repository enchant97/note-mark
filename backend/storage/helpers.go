package storage

import (
	"errors"
	"fmt"
	"path/filepath"
	"strings"

	"github.com/enchant97/note-mark/backend/core"
)

// Creates a secure absolute node path.
//
// This will ensure a slug cannot cause a path escape outside or root/user.
func createSecureNodePath(
	rootPath string,
	username core.Username,
	slug string,
) (string, error) {
	if !filepath.IsAbs(rootPath) {
		return "", fmt.Errorf("rootPath not abs '%s'", rootPath)
	}
	slug = filepath.FromSlash(slug)
	if slug == "" || slug == "." {
		return "", errors.Join(fmt.Errorf("slug must not be empty"), core.ErrSlugInvalid)
	}
	userAbsPath := filepath.Join(rootPath, string(username))
	nodeAbsPath := filepath.Join(rootPath, string(username), slug)
	safePrefix := userAbsPath + string(filepath.Separator)
	if !strings.HasPrefix(nodeAbsPath, safePrefix) {
		return "", errors.Join(fmt.Errorf("slug would escape: '%s'", nodeAbsPath), core.ErrSlugInvalid)
	}
	return nodeAbsPath, nil
}
