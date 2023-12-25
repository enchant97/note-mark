package storage

import (
	"errors"
	"fmt"
	"hash/crc32"
	"io"
	"time"

	"github.com/google/uuid"
)

var (
	ErrWrite    = errors.New("failed to write to storage backend")
	ErrRead     = errors.New("failed to read from storage backend")
	ErrNotFound = errors.New("failed to locate entry in storage backend")
)

type FileInfo struct {
	ContentLength int64     `json:"contentLength"`
	LastModified  time.Time `json:"lastModified"`
	Checksum      string    `json:"checksum"`
}

type NoteFileInfo = FileInfo

type AssetFileInfo = FileInfo

type StorageController interface {
	Setup() error
	TearDown() error
	WriteNote(noteID uuid.UUID, r io.Reader) error
	ReadNote(noteID uuid.UUID) (io.ReadCloser, error)
	ReadNoteChecksum(noteID uuid.UUID) (string, error)
	DeleteNote(noteID uuid.UUID) error
	WriteNoteAsset(noteID uuid.UUID, assetID uuid.UUID, r io.Reader) error
	ReadNoteAsset(noteID uuid.UUID, assetID uuid.UUID) (io.ReadCloser, error)
	ReadNoteAssetChecksum(noteID uuid.UUID, assetID uuid.UUID) (string, error)
	DeleteNoteAsset(noteID uuid.UUID, assetID uuid.UUID) error
	GetNoteAssetIDs(noteID uuid.UUID) ([]uuid.UUID, error)
	GetNoteInfo(noteID uuid.UUID) (NoteFileInfo, error)
	GetNoteAssetInfo(noteID uuid.UUID, assetID uuid.UUID) (AssetFileInfo, error)
}

func MakeChecksum(r io.Reader) (string, error) {
	h := crc32.New(crc32.MakeTable(crc32.IEEE))
	buf := make([]byte, 1024)
	for {
		n, err := r.Read(buf)
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
	return fmt.Sprintf("crc32-%x", h.Sum32()), nil
}
