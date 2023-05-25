package core

import (
	"io"

	"github.com/yuin/goldmark"
)

func MarkdownToHTML(source []byte, w io.Writer) error {
	return goldmark.Convert(source, w)
}
