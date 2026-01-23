package core

import (
	"time"

	"github.com/google/uuid"
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

type OidcProviderInfo struct {
	DisplayName string `json:"displayName"`
	IssuerURL   string `json:"issuerUrl"`
	ClientID    string `json:"clientId"`
}

type ServerInfo struct {
	MinSupportedVersion       string            `json:"minSupportedVersion"`
	AllowInternalSignup       bool              `json:"allowInternalSignup"`
	AllowInternalLogin        bool              `json:"allowInternalLogin"`
	EnableAnonymousUserSearch bool              `json:"enableAnonymousUserSearch"`
	OidcProvider              *OidcProviderInfo `json:"oidcProvider,omitempty"`
}

type CreateUser struct {
	Username string  `json:"username" minLength:"3" maxLength:"30" pattern:"[a-zA-Z0-9]+"`
	Name     *string `json:"name" require:"false" minLength:"3" maxLength:"128"`
	Password string  `json:"password" maxLength:"128"`
}

type UpdateUser struct {
	Name *string `json:"name" minLength:"3" maxLength:"128"`
}

type UpdateUserPassword struct {
	ExistingPassword string `json:"existingPassword" maxLength:"128"`
	NewPassword      string `json:"newPassword" maxLength:"128"`
}

type ModTime struct {
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type User struct {
	ModTime
	Uid      uuid.UUID `json:"uid"`
	Username string    `json:"username"`
	Name     *string   `json:"name"`
}
