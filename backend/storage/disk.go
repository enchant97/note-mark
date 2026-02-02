package storage

import (
	"bytes"
	"errors"
	"io"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/adrg/frontmatter"
	"go.yaml.in/yaml/v4"

	"github.com/enchant97/note-mark/backend/core"
)

var skipSystemFilesRegex = []*regexp.Regexp{
	regexp.MustCompile(`^[Tt]humbs.db$`),
	regexp.MustCompile(`^.*.DS_Store$`),
	regexp.MustCompile(`^~\$`),
}

type DiskStorageController struct {
	rootPath string
}

func (sc DiskStorageController) New(rootPath string) (DiskStorageController, error) {
	if !filepath.IsAbs(rootPath) {
		return DiskStorageController{}, errors.New("rootPath must be a absolute path")
	}
	err := os.MkdirAll(rootPath, os.ModePerm)
	return DiskStorageController{
		rootPath: rootPath,
	}, err
}

func (sc *DiskStorageController) writeFile(
	username core.Username,
	slug string,
	r io.Reader,
) error {
	absPath := filepath.Join(sc.rootPath, string(username), filepath.FromSlash(slug))
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

func (sc *DiskStorageController) readFile(
	username core.Username,
	slug string,
) (io.ReadCloser, error) {
	absPath := filepath.Join(sc.rootPath, string(username), filepath.FromSlash(slug))
	f, err := os.Open(absPath)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return nil, errors.Join(core.ErrNotFound)
		}
		return nil, err
	}
	return f, nil
}

func (sc *DiskStorageController) renameFileOrFolder(
	username core.Username,
	slug string,
	newSlug string,
) error {
	currentAbsPath := filepath.Join(sc.rootPath, string(username), filepath.FromSlash(slug))
	newAbsPath := filepath.Join(sc.rootPath, string(username), filepath.FromSlash(newSlug))
	if err := os.MkdirAll(filepath.Dir(newAbsPath), os.ModePerm); err != nil {
		return err
	}
	if err := os.Rename(currentAbsPath, newAbsPath); err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return errors.Join(core.ErrNotFound)
		}
		return err
	}
	return nil
}

func (sc *DiskStorageController) WriteNoteNode(
	username core.Username,
	slug string,
	r io.Reader,
) error {
	return sc.writeFile(username, slug+".md", r)
}

func (sc *DiskStorageController) ReadNoteNode(
	username core.Username,
	slug string,
) (io.ReadCloser, error) {
	if r, err := sc.readFile(username, slug+".md"); err == nil {
		// note exists
		return r, nil
	} else if errors.Is(err, core.ErrNotFound) {
		absPath := filepath.Join(sc.rootPath, string(username), filepath.FromSlash(slug))
		if _, err := os.Stat(absPath); errors.Is(err, fs.ErrNotExist) {
			return nil, errors.Join(err, core.ErrNotFound)
		} else if err != nil {
			return nil, err
		}
		// note does not exist, but a directory does (blank note)
		return io.NopCloser(bytes.NewReader([]byte(""))), nil
	} else {
		return nil, err
	}
}

func (sc *DiskStorageController) ReadNoteNodeFrontMatter(
	username core.Username,
	slug string,
) (core.FrontMatter, error) {
	r, err := sc.ReadNoteNode(username, slug)
	if err != nil {
		return core.FrontMatter{}, err
	}
	defer r.Close()
	var fm core.FrontMatter
	_, err = frontmatter.Parse(r, &fm)
	return fm, err
}

func (sc *DiskStorageController) UpdateNoteNodeFrontmatter(
	username core.Username,
	slug string,
	newFrontmatter core.FrontMatter,
) error {
	r, err := sc.ReadNoteNode(username, slug)
	if err != nil {
		return err
	}
	defer r.Close()
	var fm core.FrontMatter
	content, err := frontmatter.Parse(r, &fm)
	rawFm, err := yaml.Marshal(&newFrontmatter)
	if err != nil {
		return err
	}
	newContent := bytes.Join([][]byte{
		[]byte("---\n"),
		rawFm,
		[]byte("---\n\n"),
		content,
	}, []byte(""))
	return sc.WriteNoteNode(username, slug, bytes.NewBuffer(newContent))
}

func (sc *DiskStorageController) RenameNoteNode(
	username core.Username,
	slug string,
	newSlug string,
) error {
	if err := sc.renameFileOrFolder(username, slug, newSlug); err != nil {
		return err
	}
	err := sc.renameFileOrFolder(username, slug+".md", newSlug+".md")
	// handle if note directory existed, but not a note file (blank note)
	if errors.Is(err, core.ErrNotFound) {
		return nil
	}
	return err
}

func (sc *DiskStorageController) DeleteNoteNode(
	username core.Username,
	slug string,
) error {
	absPath := filepath.Join(sc.rootPath, string(username), filepath.FromSlash(slug))
	os.RemoveAll(absPath)
	err := os.Remove(absPath + ".md")
	// handle if note directory existed, but not a note file (blank note)
	if errors.Is(err, fs.ErrNotExist) {
		return nil
	}
	return err
}

func (sc *DiskStorageController) WriteAssetNode(
	username core.Username,
	slug string,
	r io.Reader,
) error {
	return sc.writeFile(username, slug, r)
}

func (sc *DiskStorageController) ReadAssetNode(
	username core.Username,
	slug string,
) (io.ReadCloser, error) {
	return sc.readFile(username, slug)
}

func (sc *DiskStorageController) RenameAssetNode(
	username core.Username,
	slug string,
	newSlug string,
) error {
	return sc.renameFileOrFolder(username, slug, newSlug)
}

func (sc *DiskStorageController) DeleteAssetNode(
	username core.Username,
	slug string,
) error {
	absPath := filepath.Join(sc.rootPath, string(username), filepath.FromSlash(slug))
	return os.Remove(absPath)
}

func (sc *DiskStorageController) DeleteUser(username core.Username) error {
	absPath := filepath.Join(sc.rootPath, string(username))
	return os.RemoveAll(absPath)
}

func (sc *DiskStorageController) DiscoverNodesForUser(
	username core.Username,
	fn DiscoverNodesFunc,
) error {
	return filepath.WalkDir(filepath.Join(sc.rootPath, string(username)), func(
		absPath string,
		d fs.DirEntry,
		err error,
	) error {
		if err != nil {
			return err
		}
		relPath, err := filepath.Rel(sc.rootPath, absPath)
		if err != nil {
			return err
		}
		relPathSplit := strings.SplitN(relPath, string(filepath.Separator), 2)
		// skip if is root path or root/username
		if len(relPathSplit) <= 1 {
			return nil
		}
		nodeUsername := relPathSplit[0]
		var nodeSlug string
		var nodeType core.NodeType
		var nodeModTime time.Time
		// get node modification time
		if info, err := d.Info(); err != nil {
			return err
		} else {
			nodeModTime = info.ModTime()
		}
		if d.IsDir() {
			// skip registering directory as note node if note file exists for it
			if _, err := os.Stat(absPath + ".md"); !errors.Is(err, fs.ErrNotExist) {
				return err
			}
		} else {
			// skip operating system files
			filename := filepath.Base(absPath)
			for _, regex := range skipSystemFilesRegex {
				if regex.MatchString(filename) {
					return nil
				}
			}
		}
		// make node slug & discover type
		if filepath.Ext(absPath) == ".md" || d.IsDir() {
			nodeSlug = strings.TrimSuffix(filepath.ToSlash(relPathSplit[1]), ".md")
			nodeType = core.NoteNode
		} else {
			nodeSlug = filepath.ToSlash(relPathSplit[1])
			nodeType = core.AssetNode
		}
		// final, more strict node check
		if !IsValidNodeSlug(path.Join(nodeUsername, nodeSlug), nodeType) {
			return nil
		}
		return fn(core.NodeEntry{}.New(
			core.NodeSlug(nodeSlug),
			nodeType,
			nodeModTime,
		))
	})
}

func (sc *DiskStorageController) DiscoverUsers(fn DiscoverUsersFunc) error {
	f, err := os.Open(sc.rootPath)
	if err != nil {
		return err
	}
	dirEntry, err := f.ReadDir(-1)
	f.Close()
	if err != nil {
		return err
	}
	for _, entry := range dirEntry {
		if entry.IsDir() {
			fn(core.Username(entry.Name()))
		}
	}
	return nil
}
