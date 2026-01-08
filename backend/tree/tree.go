package tree

import (
	"context"
	"encoding/json"
	"log"
	"strings"
	"sync"

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

func (tc *TreeController) DebugGetAsJSON() string {
	tc.mutex.RLock()
	defer tc.mutex.RUnlock()
	b, _ := json.MarshalIndent(tc.tree, "", "  ")
	return string(b)
}

func (tc *TreeController) Load() error {
	tc.mutex.Lock()
	defer tc.mutex.Unlock()
	return tc.sc.DiscoverUsers(func(username core.Username) error {
		// ensure users exist in database
		// TODO handle db errors
		tc.dao.Queries.InsertUser(context.Background(), db.InsertUserParams{
			Uid:      uuid.Must(uuid.NewV7()),
			Username: string(username),
		})
		// use cached tree if one exists
		if cachEntry, err := tc.dao.Queries.GetTreeCacheEntry(context.Background(), string(username)); err == nil {
			log.Printf("found cached tree for user '%s'\n", username)
			if _, exists := tc.tree[username]; !exists {
				tc.tree[username] = core.NodeTree{}
			}
			var cachedTree core.NodeTree
			if err := json.Unmarshal(cachEntry.NodeTree, &cachedTree); err != nil {
				return err
			}
			tc.tree[username] = cachedTree
			return nil
		}
		// discover from storage
		err := tc.ingestFromStorage(username)
		if err != nil {
			return err
		}
		// insert entries into cache, if any exist
		if tree, exists := tc.tree[username]; exists {
			log.Printf("saving ingested tree to cache for user '%s'\n", username)
			nodeTreeRaw, err := json.Marshal(tree)
			if err != nil {
				return err
			}
			return tc.dao.Queries.InsertTreeCache(context.Background(), db.InsertTreeCacheParams{
				Username: string(username),
				NodeTree: nodeTreeRaw,
			})
		}
		return nil
	})
}

func (tc *TreeController) ingestFromStorage(username core.Username) error {
	return tc.sc.DiscoverNodesForUser(username, func(nodeEntry core.NodeEntry) error {
		log.Printf("ingest: %s/%s\n", username, nodeEntry.FullSlug)
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
		if nodeEntry.Type == core.NoteNode {
			fm, err := tc.sc.ReadNoteNodeFrontMatter(username, string(nodeEntry.FullSlug))
			currentNode.FrontMatter = fm
			return err
		}
		return nil
	})
}
