package main

import (
	"errors"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

type StorageController struct {
	rootPath string
}

func (sc StorageController) New(rootPath string) (StorageController, error) {
	if !filepath.IsAbs(rootPath) {
		return StorageController{}, errors.New("rootPath must be a absolute path")
	}
	err := os.MkdirAll(rootPath, os.ModePerm)
	return StorageController{
		rootPath: rootPath,
	}, err
}

func (sc *StorageController) writeFile(
	username string,
	slug string,
	r io.Reader,
) error {
	absPath := filepath.Join(sc.rootPath, username, filepath.FromSlash(slug))
	if err := os.MkdirAll(filepath.Dir(absPath), os.ModePerm); err != nil {
		return err
	}
	f, err := os.Create(absPath)
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = io.Copy(f, r)
	if err != nil {
		return err
	}
	return nil
}

func (sc *StorageController) readFile(
	username string,
	slug string,
) (io.ReadCloser, error) {
	absPath := filepath.Join(sc.rootPath, username, filepath.FromSlash(slug))
	f, err := os.Open(absPath)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			// TODO custom error
			return nil, err
		}
		return nil, err
	}
	return f, nil
}

func (sc *StorageController) renameFileOrFolder(
	username string,
	slug string,
	newSlug string,
) error {
	currentAbsPath := filepath.Join(sc.rootPath, username, filepath.FromSlash(slug))
	newAbsPath := filepath.Join(sc.rootPath, username, filepath.FromSlash(newSlug))
	if err := os.MkdirAll(filepath.Dir(newAbsPath), os.ModePerm); err != nil {
		return err
	}
	if err := os.Rename(currentAbsPath, newAbsPath); err != nil {
		return err
	}
	return nil
}

func (sc *StorageController) WriteNoteNode(
	username string,
	slug string,
	r io.Reader,
) error {
	return sc.writeFile(username, slug+".md", r)
}

func (sc *StorageController) ReadNoteNode(
	username string,
	slug string,
) (io.ReadCloser, error) {
	return sc.readFile(username, slug+".md")
}

func (sc *StorageController) RenameNoteNode(
	username string,
	slug string,
	newSlug string,
) error {
	if err := sc.renameFileOrFolder(username, slug, newSlug); err != nil {
		return err
	}
	return sc.renameFileOrFolder(username, slug+".md", newSlug+".md")
}

func (sc *StorageController) DeleteFileNode(
	username string,
	slug string,
) error {
	absPath := filepath.Join(sc.rootPath, username, filepath.FromSlash(slug))
	os.RemoveAll(absPath)
	return os.Remove(absPath + ".md")
}

func (sc *StorageController) WriteAssetNode(
	username string,
	slug string,
	r io.Reader,
) error {
	return sc.writeFile(username, slug, r)
}

func (sc *StorageController) ReadAssetNode(
	username string,
	slug string,
) (io.ReadCloser, error) {
	return sc.readFile(username, slug)
}

func (sc *StorageController) RenameAssetNode(
	username string,
	slug string,
	newSlug string,
) error {
	return sc.renameFileOrFolder(username, slug, newSlug)
}

func (sc *StorageController) DeleteAssetNode(
	username string,
	slug string,
) error {
	absPath := filepath.Join(sc.rootPath, username, filepath.FromSlash(slug))
	return os.Remove(absPath)
}

type DiscoverNodesFunc func(username string, node NodeEntry) error

// Discover all nodes.
func (sc *StorageController) DiscoverNodes(fn DiscoverNodesFunc) error {
	return filepath.WalkDir(sc.rootPath, func(absPath string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		relPath, err := filepath.Rel(sc.rootPath, absPath)
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		relPathSplit := strings.SplitN(relPath, string(filepath.Separator), 2)
		// skip if is root path or root/username
		if len(relPathSplit) <= 1 {
			return nil
		}
		nodeUsername := relPathSplit[0]
		var nodeSlug string
		var nodeType NodeType
		if filepath.Ext(absPath) == ".md" {
			nodeSlug = strings.TrimSuffix(filepath.ToSlash(relPathSplit[1]), ".md")
			nodeType = NoteNode
		} else {
			nodeSlug = filepath.ToSlash(relPathSplit[1])
			nodeType = AssetNode
		}
		return fn(nodeUsername, NodeEntry{}.New(nodeSlug, nodeType))
	})
}
