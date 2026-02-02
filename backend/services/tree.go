package services

import (
	"io"
	"path"

	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/tree"
)

type TreeService struct {
	dao *db.DAO
	tc  *tree.TreeController
}

func (s TreeService) New(dao *db.DAO, tc *tree.TreeController) TreeService {
	return TreeService{
		dao: dao,
		tc:  tc,
	}
}

func (s *TreeService) GetTreeForUser(username core.Username) (core.NodeTree, error) {
	if tree, ok := s.tc.TryGetNodeTreeForUser(username); ok {
		return tree, nil
	}
	return nil, core.ErrNotFound
}

func (s *TreeService) GetNodeContent(
	username core.Username,
	slug core.NodeSlug,
) (io.ReadCloser, error) {
	isNoteNode := path.Ext(string(slug)) == ""
	if isNoteNode {
		return s.tc.GetNoteNodeContent(username, slug)
	}
	return s.tc.GetAssetNodeContent(username, slug)
}

func (s *TreeService) UpdateNodeContent(
	username core.Username,
	slug core.NodeSlug,
	r io.Reader,
) error {
	isNoteNode := path.Ext(string(slug)) == ""
	if isNoteNode {
		return s.tc.WriteNoteNode(username, slug, r)
	}
	return s.tc.WriteAssetNode(username, slug, r)
}

func (s *TreeService) UpdateNoteNodeFrontmatter(
	username core.Username,
	slug core.NodeSlug,
	frontmatter core.FrontMatter,
) error {
	return s.tc.UpdateNoteNodeFrontmatter(username, slug, frontmatter)
}

func (s *TreeService) RenameNode(
	username core.Username,
	slug core.NodeSlug,
	newSlug core.NodeSlug,
) error {
	return s.tc.RenameNode(username, slug, newSlug)
}

func (s *TreeService) DeleteNode(
	username core.Username,
	slug core.NodeSlug,
) error {
	return s.tc.DeleteNode(username, slug)
}
