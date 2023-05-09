package db

import "github.com/google/uuid"

type CreateUser struct {
	Username string `json:"username" validate:"required,alphanum,min=3,max=30"`
	Password string `json:"password" validate:"required"`
}

func (u *CreateUser) IntoUser() User {
	user := User{
		Username: u.Username,
	}
	user.SetPassword(u.Password)
	return user
}

type CreateBook struct {
	Name     string `json:"name" validate:"required"`
	Slug     string `json:"slug" validate:"required,slug"`
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
	Name   string    `json:"name" validate:"required"`
	Slug   string    `json:"slug" validate:"required,slug"`
	BookID uuid.UUID `json:"bookId" validate:"required"`
}

func (n *CreateNote) IntoNote() Note {
	return Note{
		Name:   n.Name,
		Slug:   n.Slug,
		BookID: n.BookID,
	}
}
