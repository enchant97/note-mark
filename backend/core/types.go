package core

import "time"

type NodeType string

const (
	NoteNode  = "note"
	AssetNode = "asset"
)

type NodeEntry struct {
	Slug    string
	Type    NodeType
	ModTime time.Time
}

func (ne NodeEntry) New(
	slug string,
	nodeType NodeType,
	modTime time.Time,
) NodeEntry {
	return NodeEntry{
		Slug: slug,
		Type: nodeType,
		ModTime: modTime,
	}
}
