package storage

import (
	"io"

	"github.com/enchant97/note-mark/backend/core"
)

type DiscoverNodesFunc func(username string, node core.NodeEntry) error

type StorageController interface {
	WriteNoteNode(username string, slug string, r io.Reader) error
	ReadNoteNode(username string, slug string) (io.ReadCloser, error)
	RenameNoteNode(username string, slug string, newSlug string) error
	DeleteNoteNode(username string, slug string) error
	WriteAssetNode(username string, slug string, r io.Reader) error
	ReadAssetNode(username string, slug string) (io.ReadCloser, error)
	RenameAssetNode(username string, slug string, newSlug string) error
	DeleteAssetNode(username string, slug string) error
	// Discover all nodes.
	DiscoverNodes(fn DiscoverNodesFunc) error
}
