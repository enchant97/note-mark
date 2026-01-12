package tree

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/db"
	"github.com/enchant97/note-mark/backend/storage"
	"github.com/google/uuid"
)

type TreeController struct {
	sc    storage.StorageController
	dao   *db.DAO
	mutex *sync.RWMutex
	tree  map[core.Username]core.NodeTree
}

func (tc TreeController) New(sc storage.StorageController, dao *db.DAO) TreeController {
	return TreeController{
		sc:    sc,
		dao:   dao,
		mutex: &sync.RWMutex{},
		tree:  map[core.Username]core.NodeTree{},
	}
}

// Get a node tree for a specific user, will return false if no tree exists.
func (tc *TreeController) TryGetNodeTreeForUser(username core.Username) (core.NodeTree, bool) {
	tc.mutex.RLock()
	defer tc.mutex.RUnlock()
	v, exists := tc.tree[username]
	return v, exists
}

// Write a new or update existing note node to tree.
func (tc *TreeController) WriteNoteNode(
	username core.Username,
	fullSlug core.NodeSlug,
	r io.Reader,
) error {
	tc.mutex.Lock()
	defer tc.mutex.Unlock()
	if err := tc.sc.WriteNoteNode(username, string(fullSlug), r); err != nil {
		return err
	}
	frontmatter, err := tc.sc.ReadNoteNodeFrontMatter(username, string(fullSlug))
	if err != nil {
		return err
	}
	if err := tc.insertNodeIntoMemory(username, core.NodeEntry{
		FullSlug: fullSlug,
		Type:     core.NoteNode,
		ModTime:  time.Now(),
	}, frontmatter); err != nil {
		return err
	}
	return tc.updateCacheFromMemory(username)
}

// Write a new or update existing asset node to tree.
func (tc *TreeController) WriteAssetNode(
	username core.Username,
	fullSlug core.NodeSlug,
	r io.Reader,
) error {
	tc.mutex.Lock()
	defer tc.mutex.Unlock()
	if err := tc.sc.WriteAssetNode(username, string(fullSlug), r); err != nil {
		return err
	}
	if err := tc.insertNodeIntoMemory(username, core.NodeEntry{
		FullSlug: fullSlug,
		Type:     core.AssetNode,
		ModTime:  time.Now(),
	}, core.FrontMatter{}); err != nil {
		return err
	}
	return tc.updateCacheFromMemory(username)
}

// Return a note node's content.
func (tc *TreeController) GetNoteNodeContent(
	username core.Username,
	slug core.NodeSlug,
) (io.ReadCloser, error) {
	tc.mutex.RLock()
	defer tc.mutex.RUnlock()
	return tc.sc.ReadNoteNode(username, string(slug))
}

// Return a asset node's content.
func (tc *TreeController) GetAssetNodeContent(
	username core.Username,
	slug core.NodeSlug,
) (io.ReadCloser, error) {
	tc.mutex.RLock()
	defer tc.mutex.RUnlock()
	return tc.sc.ReadAssetNode(username, string(slug))
}

func (tc *TreeController) DebugGetAsJSON() string {
	tc.mutex.RLock()
	defer tc.mutex.RUnlock()
	b, _ := json.MarshalIndent(tc.tree, "", "  ")
	return string(b)
}

// Reset the in-memory tree and DB cache to fresh state.
func (tc *TreeController) Reset() error {
	tc.mutex.Lock()
	defer tc.mutex.Unlock()
	if err := tc.dao.Queries.DeleteTreeCacheEntries(context.Background()); err != nil {
		return err
	}
	tc.tree = map[core.Username]core.NodeTree{}
	return nil
}

// Load node tree for every discovered user.
// Will error if in-memory tree is not in a fresh state.
//
// 1. Ensure in-memory tree is not in a fresh state
// 2. Insert user into DB if does not exist
// 3. Get tree for user from cache (if exists)
// 4. Get tree from ingesting from storage (if not in cache)
// 5. Insert tree into DB cache (if not in cache)
// 6. Add to in-memory tree
func (tc *TreeController) Load() error {
	tc.mutex.Lock()
	defer tc.mutex.Unlock()
	if len(tc.tree) != 0 {
		return errors.New("tree not in fresh state")
	}
	return tc.sc.DiscoverUsers(func(username core.Username) error {
		// ensure user exists in database
		if _, err := tc.dao.Queries.InsertUser(context.Background(), db.InsertUserParams{
			Uid:      uuid.Must(uuid.NewV7()),
			Username: string(username),
		}); err != nil && !errors.Is(core.WrapDbError(err), core.ErrConflict) {
			return err
		}
		// ensure user exists in node tree
		if _, exists := tc.tree[username]; !exists {
			tc.tree[username] = core.NodeTree{}
		}
		// use cached tree if one exists
		if cachEntry, err := tc.dao.Queries.GetTreeCacheEntry(context.Background(), string(username)); err == nil {
			log.Printf("found cached tree for user '%s'\n", username)
			var cachedTree core.NodeTree
			if err := json.Unmarshal(cachEntry.NodeTree, &cachedTree); err != nil {
				return err
			}
			tc.tree[username] = cachedTree
			return nil
		} else if !errors.Is(core.WrapDbError(err), core.ErrNotFound) {
			return err
		}
		// discover from storage
		err := tc.ingestFromStorage(username)
		if err != nil {
			return err
		}
		// insert entries into cache
		return tc.updateCacheFromMemory(username)
	})
}

// Insert or update the tree cache from current tree state in-memory.
//
// Assumes tree mutex has been locked for writing.
func (tc *TreeController) updateCacheFromMemory(username core.Username) error {
	if tree, exists := tc.tree[username]; exists {
		log.Printf("saving tree to cache for user '%s'\n", username)
		nodeTreeRaw, err := json.Marshal(tree)
		if err != nil {
			return err
		}
		// try and insert new cache
		if err := tc.dao.Queries.InsertTreeCache(context.Background(), db.InsertTreeCacheParams{
			Username: string(username),
			NodeTree: nodeTreeRaw,
		}); err == nil {
			return nil
		} else if !errors.Is(core.WrapDbError(err), core.ErrConflict) {
			return err
		}
		// update existing cache
		return tc.dao.Queries.UpdateTreeCacheEntry(context.Background(), db.UpdateTreeCacheEntryParams{
			Username: string(username),
			NodeTree: nodeTreeRaw,
		})
	}
	// no tree exists
	return nil
}

// Ingest nodes from storage for given username.
//
// Assumes tree mutex has been locked for writing.
func (tc *TreeController) ingestFromStorage(username core.Username) error {
	return tc.sc.DiscoverNodesForUser(username, func(nodeEntry core.NodeEntry) error {
		log.Printf("ingest: %s/%s\n", username, nodeEntry.FullSlug)
		var frontmatter core.FrontMatter
		if nodeEntry.Type == core.NoteNode {
			fm, err := tc.sc.ReadNoteNodeFrontMatter(username, string(nodeEntry.FullSlug))
			if err != nil {
				return err
			}
			frontmatter = fm
		}
		return tc.insertNodeIntoMemory(username, nodeEntry, frontmatter)
	})
}

// Insert a node into in-memory tree.
//
// Assumes tree mutex has been locked for writing.
func (tc *TreeController) insertNodeIntoMemory(
	username core.Username,
	nodeEntry core.NodeEntry,
	frontmatter core.FrontMatter,
) error {
	var currentTree core.NodeTree
	// handle username path
	if tree, exists := tc.tree[username]; exists {
		currentTree = tree
	} else {
		tc.tree[username] = core.NodeTree{}
		currentTree = tc.tree[username]
	}
	slugParts := strings.Split(string(nodeEntry.FullSlug), "/")
	var currentNode *core.Node
	// handle top level node
	if node, exists := currentTree[core.NodeSlug(slugParts[0])]; exists {
		currentNode = node
	} else {
		// make a default note node (will get updated later from discovery)
		node := core.Node{
			Slug:     core.NodeSlug(slugParts[0]),
			Type:     core.NoteNode,
			Children: core.NodeTree{},
		}
		currentTree[core.NodeSlug(slugParts[0])] = &node
		currentNode = &node
	}
	// handle further nodes
	for _, slugPart := range slugParts[1:] {
		slugPart := core.NodeSlug(slugPart)
		if _, exists := currentNode.Children[slugPart]; !exists {
			currentNode.Children[slugPart] = &core.Node{
				Slug:     slugPart,
				Type:     core.NoteNode,
				Children: core.NodeTree{},
			}
		}
		currentNode = currentNode.Children[slugPart]
	}
	// setup final node (the actual node we indented to add)
	currentNode.ModTime = nodeEntry.ModTime
	currentNode.Type = nodeEntry.Type
	// handle noteNode
	if nodeEntry.Type == core.NoteNode {
		currentNode.FrontMatter = frontmatter
	}
	return nil
}
