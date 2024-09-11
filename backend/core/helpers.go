package core

import (
	"os"
	"time"
)

// / Check whether directory is empty.
// / Will return true if directory does not exist.
func IsDirEmpty(name string) bool {
	if files, err := os.ReadDir(name); err == nil && len(files) != 0 {
		return false
	}
	return true
}

func TimeIntoHTTPFormat(t time.Time) string {
	if loc, err := time.LoadLocation("GMT"); err != nil {
		panic("failed to load GMT timezone")
	} else {
		return t.In(loc).Format(time.RFC1123)
	}
}
