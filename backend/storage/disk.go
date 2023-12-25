package storage

import (
	"errors"
	"fmt"
	"hash/crc64"
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

func getNoteAssetsDirectory(base string, noteID uuid.UUID) string {
	return path.Join(getNoteDirectory(base, noteID), "assets/")
}

func getNoteAssetFileName(assetID uuid.UUID) string {
	return assetID.String() + ".bin"
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

func (c *DiskController) getNoteAssetsDirectory(noteID uuid.UUID) string {
	return getNoteAssetsDirectory(c.baseDataPath, noteID)
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

func (c *DiskController) ReadNoteChecksum(noteID uuid.UUID) (string, error) {
	if reader, err := c.ReadNote(noteID); err != nil {
		return "", err
	} else {
		defer reader.Close()
		h := crc64.New(crc64.MakeTable(crc64.ISO))
		buf := make([]byte, 1024)
		for {
			n, err := reader.Read(buf)
			if err != nil && err != io.EOF {
				return "", err
			}
			if n == 0 {
				break
			}
			if _, err := h.Write(buf); err != nil {
				return "", err
			}
		}
		return fmt.Sprintf("%x", h.Sum64()), nil
	}
}

func (c *DiskController) DeleteNote(noteID uuid.UUID) error {
	dirPath := c.getNoteDirectory(noteID)
	if err := os.RemoveAll(dirPath); err != nil {
		return errors.Join(err, ErrWrite)
	}
	return nil
}

func (c *DiskController) WriteNoteAsset(noteID uuid.UUID, assetID uuid.UUID, r io.Reader) error {
	dirPath := c.getNoteAssetsDirectory(noteID)
	if err := os.MkdirAll(dirPath, os.ModePerm); err != nil {
		return errors.Join(err, ErrWrite)
	}
	filePath := path.Join(dirPath, getNoteAssetFileName(assetID))
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

func (c *DiskController) ReadNoteAsset(noteID uuid.UUID, assetID uuid.UUID) (io.ReadCloser, error) {
	filePath := path.Join(c.getNoteAssetsDirectory(noteID), getNoteAssetFileName(assetID))
	f, err := os.Open(filePath)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return nil, errors.Join(err, ErrNotFound)
		}
		return nil, errors.Join(err, ErrRead)
	}
	return f, nil
}

func (c *DiskController) DeleteNoteAsset(noteID uuid.UUID, assetID uuid.UUID) error {
	filePath := path.Join(c.getNoteAssetsDirectory(noteID), getNoteAssetFileName(assetID))
	if err := os.Remove(filePath); err != nil {
		return errors.Join(err, ErrWrite)
	}
	return nil
}

func (c *DiskController) GetNoteAssetIDs(noteID uuid.UUID) ([]uuid.UUID, error) {
	dirPath := c.getNoteAssetsDirectory(noteID)
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return nil, errors.Join(err, ErrRead)
	}
	filtersEntries := make([]uuid.UUID, len(entries))
	for _, entry := range entries {
		if !entry.Type().IsRegular() && path.Ext(entry.Name()) == ".bin" {
			if assetID, err := uuid.Parse(path.Base(entry.Name())); err == nil {
				filtersEntries = append(filtersEntries, assetID)
			}
		}
	}
	return filtersEntries, nil
}

func (c *DiskController) GetNoteInfo(noteID uuid.UUID) (NoteFileInfo, error) {
	filePath := path.Join(c.getNoteDirectory(noteID), diskStorageNoteFileName)
	i, err := os.Stat(filePath)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return NoteFileInfo{}, errors.Join(err, ErrNotFound)
		}
		return NoteFileInfo{}, errors.Join(err, ErrRead)
	}
	info := NoteFileInfo{
		ContentLength: i.Size(),
		LastModified:  i.ModTime(),
	}

	return info, nil
}

func (c *DiskController) GetNoteAssetInfo(noteID uuid.UUID, assetID uuid.UUID) (AssetFileInfo, error) {
	filePath := path.Join(c.getNoteAssetsDirectory(noteID), getNoteAssetFileName(assetID))
	i, err := os.Stat(filePath)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return AssetFileInfo{}, errors.Join(err, ErrNotFound)
		}
		return AssetFileInfo{}, errors.Join(err, ErrRead)
	}
	info := AssetFileInfo{
		ContentLength: i.Size(),
		LastModified:  i.ModTime(),
	}

	return info, nil
}
