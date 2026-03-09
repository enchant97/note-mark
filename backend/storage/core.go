package storage

import (
	"github.com/enchant97/note-mark/backend/core"
	"io"
)

type DiscoverNodesFunc func(node core.NodeEntry) error
type DiscoverUsersFunc func(username core.Username) error

type StorageController interface {
	WriteNoteNode(username core.Username, slug string, r io.Reader) error
	ReadNoteNode(username core.Username, slug string) (io.ReadCloser, error)
	ReadNoteNodeFrontMatter(username core.Username, slug string) (core.FrontMatter, error)
	UpdateNoteNodeFrontmatter(username core.Username, slug string, newFrontmatter core.FrontMatter) error
	RenameNoteNode(username core.Username, slug string, newSlug string) error
	DeleteNoteNode(username core.Username, slug string) error
	WriteAssetNode(username core.Username, slug string, r io.Reader) error
	ReadAssetNode(username core.Username, slug string) (io.ReadCloser, error)
	RenameAssetNode(username core.Username, slug string, newSlug string) error
	DeleteAssetNode(username core.Username, slug string) error
	DeleteUser(username core.Username) error
	// Discover all nodes for a given username. Will skip over invalid names.
	DiscoverNodesForUser(username core.Username, fn DiscoverNodesFunc) error
	// Discover all usernames. Will skip over invalid names.
	DiscoverUsers(fn DiscoverUsersFunc) error
}
