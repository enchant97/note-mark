package storage

import (
	"io"
	"path"
	"strings"

	"github.com/enchant97/note-mark/backend/core"
)

type DiscoverNodesFunc func(username core.Username, node core.NodeEntry) error

type StorageController interface {
	WriteNoteNode(username core.Username, slug string, r io.Reader) error
	ReadNoteNode(username core.Username, slug string) (io.ReadCloser, error)
	RenameNoteNode(username core.Username, slug string, newSlug string) error
	DeleteNoteNode(username core.Username, slug string) error
	WriteAssetNode(username core.Username, slug string, r io.Reader) error
	ReadAssetNode(username core.Username, slug string) (io.ReadCloser, error)
	RenameAssetNode(username core.Username, slug string, newSlug string) error
	DeleteAssetNode(username core.Username, slug string) error
	// Discover all nodes.
	DiscoverNodes(fn DiscoverNodesFunc) error
}

// Validate if node's full slug (including username) is valid.
//
// - It is not the root path
// - It is not the root+username path
// - FileNode is not in a AssetNode
// - AssetNode is not NoteNode
// - AssetNode is not root+username+asset.ext
func IsValidNodeSlug(fullSlug string, nodeType core.NodeType) bool {
	// slugs must be relative not absolute or end in slash
	if strings.HasPrefix(fullSlug, "/") || strings.HasSuffix(fullSlug, "/") {
		return false
	}
	slugSplit := strings.SplitN(fullSlug, "/", 3)
	// slug is " " or "/{username}"
	if len(slugSplit) <= 1 {
		return false
	}
	slugExt := path.Ext(fullSlug)
	// slug is "/{example...}.{ext}" and note
	if nodeType == core.NoteNode && slugExt != "" {
		return false
	}
	// slug is "/{example...}" and asset
	if nodeType == core.AssetNode && slugExt == "" {
		return false
	}
	// slug is "/{example}" and asset
	if nodeType == core.AssetNode && len(slugSplit) <= 2 {
		return false
	}
	return true
}
