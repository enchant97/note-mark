package main

import "github.com/google/uuid"

type NodeType string

const (
	DirNode   = "dir"
	NoteNode  = "note"
	AssetNode = "asset"
)

type NodeEntry struct {
	Uid  uuid.UUID
	Path string
	Type NodeType
}

func (ne NodeEntry) New(
	uid uuid.UUID,
	path string,
	nodeType NodeType,
) NodeEntry {
	return NodeEntry{
		Uid:  uid,
		Path: path,
		Type: nodeType,
	}
}
