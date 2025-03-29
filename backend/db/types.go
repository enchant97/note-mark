package db

import (
	"time"

	"github.com/google/uuid"
)

type CreateUser struct {
	Username string  `json:"username" minLength:"3" maxLength:"30" pattern:"[a-zA-Z0-9]+"`
	Password string  `json:"password"`
	Name     *string `json:"name" require:"false" maxLength:"128"`
}

func (u *CreateUser) IntoUser() User {
	user := User{
		Username: u.Username,
		Name:     u.Name,
	}
	user.SetPassword(u.Password)
	return user
}

type CreateBook struct {
	Name     string `json:"name" required:"true" minLength:"1" maxLength:"80"`
	Slug     string `json:"slug" required:"true" minLength:"1" maxLength:"80" pattern:"[a-z0-9-]+"`
	IsPublic bool   `json:"isPublic,omitempty" default:"false"`
}

func (b *CreateBook) IntoBook(ownerID uuid.UUID) Book {
	return Book{
		Name:     b.Name,
		Slug:     b.Slug,
		OwnerID:  ownerID,
		IsPublic: b.IsPublic,
	}
}

type CreateNote struct {
	Name string `json:"name" required:"true" minLength:"1" maxLength:"80"`
	Slug string `json:"slug" required:"true" minLength:"1" maxLength:"80" pattern:"[a-z0-9-]+"`
}

func (n *CreateNote) IntoNote(bookID uuid.UUID) Note {
	return Note{
		Name:   n.Name,
		Slug:   n.Slug,
		BookID: bookID,
	}
}

type ValueWithSlug struct {
	Value any    `json:"value"`
	Slug  string `json:"slug"`
}

type UpdateUser struct {
	UpdatedAt time.Time `json:"-" hidden:"true" readOnly:"true"`
	Name      string    `json:"name" require:"true" maxLength:"128"`
}

type UpdateUserPassword struct {
	ExistingPassword string `json:"existingPassword"`
	NewPassword      string `json:"newPassword"`
}

type UpdateBook struct {
	UpdatedAt time.Time `json:"-" hidden:"true" readOnly:"true"`
	Name      string    `json:"name" require:"true" minLength:"1" maxLength:"80"`
	Slug      string    `json:"slug" require:"true" minLength:"1" maxLength:"80" pattern:"[a-z0-9-]+"`
	IsPublic  bool      `json:"isPublic" require:"true"`
}

type UpdateNote struct {
	UpdatedAt time.Time `json:"-" hidden:"true" readOnly:"true"`
	Name      string    `json:"name" require:"true" minLength:"1" maxLength:"80"`
	Slug      string    `json:"slug" require:"true" minLength:"1" maxLength:"80" pattern:"[a-z0-9-]+"`
}
