package main

type NodeType string

const (
	NoteNode  = "note"
	AssetNode = "asset"
)

type NodeEntry struct {
	Slug string
	Type NodeType
}

func (ne NodeEntry) New(
	slug string,
	nodeType NodeType,
) NodeEntry {
	return NodeEntry{
		Slug: slug,
		Type: nodeType,
	}
}
