package core

import (
	"io"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
)

var markdownRenderer = goldmark.New(
	goldmark.WithExtensions(
		extension.GFM,
		extension.DefinitionList,
		extension.Footnote,
	),
)

func MarkdownToHTML(source []byte, w io.Writer) error {
	return markdownRenderer.Convert(source, w)
}
