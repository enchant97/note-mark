package storage

import (
	"errors"
	"io"
	"io/fs"
	"os"
	"path"

	"github.com/google/uuid"
)

const diskStorageNoteFileName = "note.md"

// returns path as: `base / notes / note-id[:2] / note-id`
func getNoteDirectory(base string, noteID uuid.UUID) string {
	noteIDString := noteID.String()
	noteIDStringPart := noteIDString[:2]
	dirPath := path.Join(base, "notes", noteIDStringPart, noteIDString)
	return dirPath
}

type DiskController struct {
	baseDataPath string
}

func (c DiskController) New(baseDataPath string) StorageController {
	c = DiskController{
		baseDataPath: baseDataPath,
	}
	return &c
}

func (c *DiskController) getNoteDirectory(noteID uuid.UUID) string {
	return getNoteDirectory(c.baseDataPath, noteID)
}

func (c *DiskController) Setup() error {
	if err := os.MkdirAll(c.baseDataPath, os.ModePerm); err != nil {
		return errors.Join(err, ErrWrite)
	}
	return nil
}

func (c *DiskController) TearDown() error {
	return nil
}

func (c *DiskController) WriteNote(noteID uuid.UUID, r io.Reader) error {
	dirPath := c.getNoteDirectory(noteID)
	if err := os.MkdirAll(dirPath, os.ModePerm); err != nil {
		return errors.Join(err, ErrWrite)
	}
	filePath := path.Join(dirPath, diskStorageNoteFileName)
	f, err := os.Create(filePath)
	if err != nil {
		errors.Join(err, ErrWrite)
	}
	defer f.Close()
	_, err = io.Copy(f, r)
	if err != nil {
		return errors.Join(err, ErrWrite)
	}
	return nil
}

func (c *DiskController) ReadNote(noteID uuid.UUID) (io.ReadCloser, error) {
	filePath := path.Join(c.getNoteDirectory(noteID), diskStorageNoteFileName)
	f, err := os.Open(filePath)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return nil, errors.Join(err, ErrNotFound)
		}
		return nil, errors.Join(err, ErrRead)
	}
	return f, nil
}

func (c *DiskController) DeleteNote(noteID uuid.UUID) error {
	dirPath := c.getNoteDirectory(noteID)
	if err := os.RemoveAll(dirPath); err != nil {
		return errors.Join(err, ErrWrite)
	}
	return nil
}

func (c *DiskController) GetNoteInfo(noteID uuid.UUID) (NoteInfo, error) {
	filePath := path.Join(c.getNoteDirectory(noteID), diskStorageNoteFileName)
	i, err := os.Stat(filePath)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return NoteInfo{}, errors.Join(err, ErrNotFound)
		}
		return NoteInfo{}, errors.Join(err, ErrRead)
	}
	info := NoteInfo{
		ContentLength: i.Size(),
		LastModified:  i.ModTime(),
	}

	return info, nil
}
