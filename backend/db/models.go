package db

import (
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UUIDBase struct {
	ID uuid.UUID `gorm:"primarykey;type:uuid" json:"id"`
}

func (base *UUIDBase) BeforeCreate(tx *gorm.DB) (err error) {
	base.ID = uuid.New()
	return
}

type TimeBase struct {
	CreatedAt time.Time      `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"autoUpdateTime" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deletedAt,omitempty"`
}

type User struct {
	UUIDBase
	TimeBase
	Username string  `gorm:"uniqueIndex;not null;type:varchar(30)" json:"username"`
	Password []byte  `gorm:"not null" json:"-"`
	Name     *string `gorm:"size:128" json:"name"`
	Books    []Book  `gorm:"foreignKey:OwnerID" json:"-"`
}

func (u *User) SetPassword(newPlainPassword string) {
	hashedPw, err := bcrypt.GenerateFromPassword([]byte(newPlainPassword), bcrypt.DefaultCost)
	if err != nil {
		panic(err)
	}
	u.Password = hashedPw
}

func (u *User) IsPasswordMatch(plainPassword string) bool {
	if err := bcrypt.CompareHashAndPassword(u.Password, []byte(plainPassword)); err == nil {
		return true
	}
	return false
}

type Note struct {
	UUIDBase
	TimeBase
	Name   string    `gorm:"not null;type:varchar(80)" json:"name"`
	Slug   string    `gorm:"index:idx_note,unique;not null;type:varchar(80)" json:"slug"`
	BookID uuid.UUID `gorm:"index:idx_note,unique;not null;type:uuid" json:"bookId"`
	Book   Book      `gorm:"foreignKey:BookID" json:"-"`
}

type Book struct {
	UUIDBase
	TimeBase
	Name     string    `gorm:"not null;type:varchar(80)" json:"name"`
	Slug     string    `gorm:"index:idx_book,unique;not null;type:varchar(80)" json:"slug"`
	OwnerID  uuid.UUID `gorm:"index:idx_book,unique;not null;type:uuid" json:"ownerId"`
	IsPublic bool      `gorm:"not null;default:false;type:boolean" json:"isPublic"`
	Owner    User      `json:"-"`
	Notes    []Note    `gorm:"foreignKey:BookID" json:"-"`
}
