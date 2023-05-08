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
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type User struct {
	UUIDBase
	TimeBase
	Username string `gorm:"uniqueIndex;not null;type:varchar(30)" json:"username"`
	Password []byte `gorm:"not null" json:"-"`
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
