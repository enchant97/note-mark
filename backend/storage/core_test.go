package storage

import (
	"testing"

	"github.com/enchant97/note-mark/backend/core"
)

func TestIsValidNodeSlug(t *testing.T) {
	tests := []struct {
		nodeSlug string
		nodeType core.NodeType
		expect   bool
	}{
		{"leo/my-note", core.NoteNode, true},
		{"leo/my-note/test", core.NoteNode, true},
		{"leo/my-note/example.jpg", core.AssetNode, true},
		{"leo/my-note/test/example.jpg", core.AssetNode, true},
		{"leo", core.NoteNode, false},
		{"", core.NoteNode, false},
		{"/", core.NoteNode, false},
		{"leo/my-note/example.jpg", core.NoteNode, false},
		{"leo/my-note/", core.NoteNode, false},
		{"leo", core.AssetNode, false},
		{"", core.AssetNode, false},
		{"/", core.AssetNode, false},
		{"leo/example.jpg", core.AssetNode, false},
		{"example.jpg", core.AssetNode, false},
		{"leo/my-note", core.AssetNode, false},
		{"leo/my-note.jpg/", core.AssetNode, false},
	}
	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			actual := IsValidNodeSlug(tt.nodeSlug, tt.nodeType)
			if actual != tt.expect {
				t.Errorf(
					"actual '%v' expect '%v' (slug '%s' type '%s')",
					actual,
					tt.expect,
					tt.nodeSlug,
					tt.nodeType,
				)
			}
		})
	}
}
