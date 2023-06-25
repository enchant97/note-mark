package main

import (
	"log"

	"github.com/enchant97/note-mark/backend/cli"
)

// set this during build
var Version = "unknown"

func main() {
    if err := cli.Entrypoint(Version); err != nil {
        log.Fatal(err)
    }
}
