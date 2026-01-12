package core

import (
	"encoding/json"
	"errors"
)

const CurrentTreeCacheVersion = 1

var ErrInvalidCacheVersion = errors.New("invalid cache version")

type TreeCacheEntry struct {
	Cache   []byte
	Version int64
}

func UnmarshalTreeCache(entry TreeCacheEntry, v *NodeTree) error {
	if !IsTreeCacheCompatible(entry.Version) {
		return ErrInvalidCacheVersion
	}
	return json.Unmarshal(entry.Cache, &v)
}

func MarshalTreeCache(v NodeTree) (TreeCacheEntry, error) {
	rawCache, err := json.Marshal(v)
	if err != nil {
		return TreeCacheEntry{}, err
	}
	return TreeCacheEntry{
		Cache:   rawCache,
		Version: CurrentTreeCacheVersion,
	}, nil
}

func IsTreeCacheCompatible(version int64) bool {
	return version == CurrentTreeCacheVersion
}
