package core

import (
	"testing"
)

func TestIsValidUsername(t *testing.T) {
	tests := []struct {
		username string
		expect   bool
	}{
		{"l", true},
		{"123", true},
		{"leo", true},
		{"Leo", true},
		{"Steve1234", true},
		{"invalid!", false},
		{"", false},
		{".", false},
	}
	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			actual := IsValidUsername(tt.username)
			if actual != tt.expect {
				t.Errorf(
					"actual '%v' expect '%v' (username '%s')",
					actual,
					tt.expect,
					tt.username,
				)
			}
		})
	}
}

func TestIsValidFullSlug(t *testing.T) {
	tests := []struct {
		slug   string
		expect bool
	}{
		{"n", true},
		{"my-note", true},
		{"my-note/and-somthing", true},
		{"note/00", true},
		{"note/asset.jpg", true},
		{"note/My Amazing Picture.jpg", true},
		{"My Note", true},
		{"note/asset.JPG", true},
		{"my-note.md", false},
		{"note/0!", false},
	}
	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			actual := IsValidFullSlug(tt.slug)
			if actual != tt.expect {
				t.Errorf(
					"actual '%v' expect '%v' (slug '%s')",
					actual,
					tt.expect,
					tt.slug,
				)
			}
		})
	}
}

func TestIsValidNodeSlug(t *testing.T) {
	tests := []struct {
		nodeSlug string
		nodeType NodeType
		expect   bool
	}{
		{"my-note", NoteNode, true},
		{"my-note/test", NoteNode, true},
		{"my-note/example.jpg", AssetNode, true},
		{"my-note/test/example.jpg", AssetNode, true},
		{"", NoteNode, false},
		{"/", NoteNode, false},
		{"my-note/example.jpg", NoteNode, false},
		{"my-note/", NoteNode, false},
		{"", AssetNode, false},
		{"/", AssetNode, false},
		{"example.jpg", AssetNode, false},
		{"example.jpg", AssetNode, false},
		{"my-note", AssetNode, false},
		{"my-note.jpg/", AssetNode, false},
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
