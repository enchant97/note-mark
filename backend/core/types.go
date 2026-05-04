package core

import (
	"time"

	"github.com/google/uuid"
)

type NodeType string
type Username string
type AccessControlMode string

const (
	NoteNode  = "note"
	AssetNode = "asset"

	AccessControlReadMode  AccessControlMode = "read"
	AccessControlWriteMode AccessControlMode = "write"
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

type AccessControl struct {
	PublicRead bool                           `json:"publicRead,omitempty" yaml:"publicRead"`
    Users      map[Username]AccessControlMode `json:"users,omitempty" yaml:"users,omitempty"`
}

type FrontMatter struct {
    Title         string         `json:"title,omitempty" yaml:"title"`
	AccessControl *AccessControl `json:"accessControl,omitempty" yaml:"accessControl,omitempty"`
}

type NoteNodeFields struct {
	FrontMatter FrontMatter `json:"frontmatter"`
	Children    NodeTree    `json:"children"`
}

type Node struct {
	Slug    NodeSlug  `json:"slug"`
	Type    NodeType  `json:"type"`
	ModTime time.Time `json:"modTime"`
	*NoteNodeFields
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

type CreateUserWithPassword struct {
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
