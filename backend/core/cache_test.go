package core

import (
	"encoding/json"
	"errors"
	"reflect"
	"testing"
)

func TestUnmarshalTreeCache(t *testing.T) {
	tests := []struct {
		entry         TreeCacheEntry
		expectedValue NodeTree
		expectedError error
	}{
		{TreeCacheEntry{Version: 1, Cache: []byte("{}")}, NodeTree{}, nil},
		{TreeCacheEntry{Version: 2, Cache: []byte("{}")}, nil, ErrInvalidCacheVersion},
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			var actualValue NodeTree
			if err := UnmarshalTreeCache(tt.entry, &actualValue); !errors.Is(err, tt.expectedError) {
				t.Errorf("expected err '%v' got '%v'", tt.expectedError, err)
			} else {
				expected, _ := json.Marshal(tt.expectedValue)
				actual, _ := json.Marshal(actualValue)
				if !reflect.DeepEqual(tt.expectedValue, actualValue) {
					t.Errorf("expected '%s' got %s", expected, actual)
				}
			}
		})
	}
}

func TestMarshalTreeCache(t *testing.T) {
	tests := []struct {
		entry         NodeTree
		expectedValue TreeCacheEntry
		expectedError error
	}{
		{NodeTree{}, TreeCacheEntry{Version: 1, Cache: []byte("{}")}, nil},
	}
	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			actualValue, err := MarshalTreeCache(tt.entry)
			if !errors.Is(err, tt.expectedError) {
				t.Errorf("expected err '%v' got '%v'", tt.expectedError, err)
			} else {
				expected, _ := json.Marshal(tt.expectedValue)
				actual, _ := json.Marshal(actualValue)
				if !reflect.DeepEqual(tt.expectedValue, actualValue) {
					t.Errorf("expected '%s' got %s", expected, actual)
				}
			}
		})
	}
}

func TestIsTreeCacheCompatible(t *testing.T) {
	tests := []struct {
		version  int64
		expected bool
	}{
		{1, true},
		{-1, false},
		{0, false},
		{2, false},
	}
	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			actual := IsTreeCacheCompatible(tt.version)
			if actual != tt.expected {
				t.Errorf("expected '%v' got '%v'", tt.expected, actual)
			}
		})
	}
}
