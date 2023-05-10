package storage

import (
	"testing"

	"github.com/google/uuid"
)

func Test_getNoteDirectory(t *testing.T) {
	expected := "/data/notes/ce9/ce9e6f8e-d2a1-41fb-a4f0-48fcdf791b39"
	actual := getNoteDirectory("/data", uuid.MustParse("ce9e6f8e-d2a1-41fb-a4f0-48fcdf791b39"))
	if expected != actual {
		t.FailNow()
	}
}
