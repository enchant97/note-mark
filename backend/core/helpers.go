package core

import (
	"database/sql"
	"log"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func MustNewUID() uuid.UUID {
	uid, err := uuid.NewV7()
	return uuid.Must(uid, err)
}

func HashPassword(plainPassword string) []byte {
	hashedPw, err := bcrypt.GenerateFromPassword(
		[]byte(plainPassword),
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

func StringPtrToNullString(v *string) sql.NullString {
	if v == nil {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{
		String: *v,
		Valid:  true,
	}
}

func NullStringToStringPtr(v sql.NullString) *string {
	if v.Valid {
		return &v.String
	}
	return nil
}

func TimeIntoHTTPFormat(t time.Time) string {
	if loc, err := time.LoadLocation("GMT"); err != nil {
		panic("failed to load GMT timezone")
	} else {
		return t.In(loc).Format(time.RFC1123)
	}
}
