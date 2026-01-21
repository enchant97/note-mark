package core

import (
	"log"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func MustNewUID() uuid.UUID {
	uid, err := uuid.NewV7()
	return uuid.Must(uid, err)
}

func HashPassword(plainPassword string) []byte {
	hashedPw, err := bcrypt.GenerateFromPassword([]byte(
		plainPassword),
		bcrypt.DefaultCost,
	)
	if err != nil {
		log.Panicln(err)
	}
	return hashedPw
}

func DoesPasswordMatchHashed(plain string, hashed []byte) bool {
	return bcrypt.CompareHashAndPassword(hashed, []byte(plain)) == nil
}
