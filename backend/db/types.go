package db

import (
	"time"

	"github.com/google/uuid"
)

type CreateUser struct {
	Username string  `json:"username" validate:"required,alphanum,min=3,max=30"`
	Password string  `json:"password" validate:"required"`
	Name     *string `json:"name" validate:"omitempty,max=128"`
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
	Name     string `json:"name" validate:"required,max=80"`
	Slug     string `json:"slug" validate:"required,max=80,slug"`
	IsPublic bool   `json:"isPublic"`
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
	Name string `json:"name" validate:"required,max=80"`
	Slug string `json:"slug" validate:"required,max=80,slug"`
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
	UpdatedAt time.Time `json:"-"`
	Name      *string   `json:"name" validate:"omitempty,max=128"`
}

type UpdateUserPassword struct {
	ExistingPassword string `json:"existingPassword"`
	NewPassword      string `json:"newPassword"`
}

type UpdateBook struct {
	UpdatedAt time.Time `json:"-"`
	Name      *string   `json:"name,omitempty" validate:"omitempty,max=80"`
	Slug      *string   `json:"slug,omitempty" validate:"omitempty,max=80,slug"`
	IsPublic  *bool     `json:"isPublic,omitempty"`
}

type UpdateNote struct {
	UpdatedAt time.Time `json:"-"`
	Name      *string   `json:"name,omitempty" validate:"omitempty,max=80"`
	Slug      *string   `json:"slug,omitempty" validate:"omitempty,max=80,slug"`
}
