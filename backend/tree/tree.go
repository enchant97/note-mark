package tree

import (
	"encoding/json"
	"log"
	"strings"
	"sync"

	"github.com/enchant97/note-mark/backend/core"
	"github.com/enchant97/note-mark/backend/storage"
)

type TreeController struct {
	sc    storage.StorageController
	mutex *sync.RWMutex
	tree  map[core.Username]core.NodeTree
}

func (tc TreeController) New(sc storage.StorageController) TreeController {
	return TreeController{
		sc:    sc,
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

func (tc *TreeController) Ingest() error {
	tc.mutex.Lock()
	defer tc.mutex.Unlock()
	return tc.sc.DiscoverNodes(func(username core.Username, nodeEntry core.NodeEntry) error {
		log.Printf("ingesting: %s/%s\n", username, nodeEntry.FullSlug)
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
		return nil
	})
}
