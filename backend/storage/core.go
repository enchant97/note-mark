package storage

import (
	"errors"
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
	ContentLength int64
	LastModified  time.Time
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
	DeleteNoteAsset(noteID uuid.UUID, assetID uuid.UUID) error
	GetNoteAssetIDs(noteID uuid.UUID) ([]uuid.UUID, error)
	GetNoteInfo(noteID uuid.UUID) (NoteFileInfo, error)
	GetNoteAssetInfo(noteID uuid.UUID, assetID uuid.UUID) (AssetFileInfo, error)
}
