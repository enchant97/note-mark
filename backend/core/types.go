package core

import (
	"time"
)

type NodeType string
type Username string

const (
	NoteNode  = "note"
	AssetNode = "asset"
)

type NodeEntry struct {
	FullSlug NodeSlug
	Type     NodeType
	ModTime  time.Time
}

func (ne NodeEntry) New(
	fullSlug NodeSlug,
	nodeType NodeType,
	modTime time.Time,
) NodeEntry {
	return NodeEntry{
		FullSlug: fullSlug,
		Type:     nodeType,
		ModTime:  modTime,
	}
}

type NodeSlug string
type NodeTree map[NodeSlug]*Node

type FrontMatter struct {
	Title string `json:"title"`
}

type Node struct {
	FrontMatter
	Slug     NodeSlug  `json:"slug"`
	Type     NodeType  `json:"type"`
	ModTime  time.Time `json:"modTime"`
	Children NodeTree  `json:"children"`
}
