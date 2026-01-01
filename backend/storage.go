package main

import (
	"errors"
	"io"
	"io/fs"
	"os"
	"path/filepath"

	"github.com/google/uuid"
)

type StorageController struct {
	rootPath string
}

func (sc StorageController) New(rootPath string) (StorageController, error) {
	if !filepath.IsAbs(rootPath) {
		return StorageController{}, errors.New("rootPath must be a absolute path")
	}
	err := os.MkdirAll(rootPath, 0755)
	return StorageController{
		rootPath: rootPath,
	}, err
}

func (sc *StorageController) writeUidAnchor(
	fp string,
	nodeUid uuid.UUID,
) error {
	absPath := filepath.Join(sc.rootPath, fp+".uid")
	f, err := os.Create(absPath)
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = f.Write(nodeUid[:])
	if err != nil {
		return err
	}
	return nil
}

func (sc *StorageController) readUidAnchor(fp string) (uuid.UUID, error) {
	absPath := filepath.Join(sc.rootPath, fp+".uid")
	rawContent, err := os.ReadFile(absPath)
	if err != nil {
		return uuid.Nil, err
	}
	return uuid.FromBytes(rawContent)
}

func (sc *StorageController) deleteUidAnchor(
	fp string,
) error {
	absPath := filepath.Join(sc.rootPath, fp+".uid")
	return os.Remove(absPath)
}

func (sc *StorageController) WriteFileNode(
	fp string,
	nodeUid uuid.UUID,
	r io.Reader,
) error {
	// TODO
	return nil
}

func (sc *StorageController) renameNode(
	fp string,
	newfp string,
	nodeUid uuid.UUID,
) error {
	currentAbsPath := filepath.Join(sc.rootPath, fp)
	newAbsPath := filepath.Join(sc.rootPath, newfp)
	if err := sc.writeUidAnchor(newAbsPath, nodeUid); err != nil {
		return err
	}
	if err := os.Rename(currentAbsPath, newAbsPath); err != nil {
		return err
	}
	return sc.deleteUidAnchor(currentAbsPath)
}

func (sc *StorageController) ReadFileNode(
	fp string,
	nodeUid uuid.UUID,
) (io.ReadCloser, error) {
	// TODO
	return nil, nil
}

func (sc *StorageController) RenameFileNode(
	fp string,
	newfp string,
	nodeUid uuid.UUID,
) error {
	return sc.renameNode(fp, newfp, nodeUid)
}

func (sc *StorageController) DeleteFileNode(
	fp string,
	nodeUid uuid.UUID,
) error {
	// TODO
	return nil
}

func (sc *StorageController) CreateDirNode(
	fp string,
	nodeUid uuid.UUID,
) error {
	// TODO
	return nil
}

func (sc *StorageController) RenameDirNode(
	fp string,
	newfp string,
	nodeUid uuid.UUID,
) error {
	return sc.renameNode(fp, newfp, nodeUid)
}

func (sc *StorageController) DeleteDirNode(
	fp string,
	nodeUid uuid.UUID,
) error {
	// TODO
	return nil
}

type DiscoverNodesFunc func(node NodeEntry) error

func (sc *StorageController) DiscoverNodes(fn DiscoverNodesFunc) error {
	return filepath.WalkDir(sc.rootPath, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		// skip if is root path or root/username
		if len(filepath.SplitList(sc.rootPath)) <= 2 {
			return nil
		}
		// skip anchor as not a node
		if filepath.Ext(path) == ".uid" {
			return nil
		}
		relPath, err := filepath.Rel(sc.rootPath, path)
		if err != nil {
			return err
		}
		// read a anchor, if one exists (if missing, it must be new file to import)
		nodeUid, err := sc.readUidAnchor(relPath)
		if err != nil && !errors.Is(err, os.ErrNotExist) {
			return err
		}
		// get the node type
		var nodeType NodeType
		if d.IsDir() {
			nodeType = DirNode
		} else if filepath.Ext(path) == ".md" {
			nodeType = NoteNode
		} else {
			nodeType = AssetNode
		}
		return fn(NodeEntry{}.New(nodeUid, relPath, nodeType))
	})
}
