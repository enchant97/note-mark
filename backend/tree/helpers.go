package tree

import (
	"strings"

	"github.com/enchant97/note-mark/backend/core"
)

// Filter a node tree by using the AccessControl data.
func FilteredNodeTree(tree core.NodeTree, username *core.Username) core.NodeTree {
	filteredMap := core.NodeTree{}
	for slug, node := range tree {
		if filteredNode := FilteredNode(*node, username); filteredNode != nil {
			filteredMap[slug] = node
		}
	}
	return filteredMap
}

func FilteredNode(node core.Node, username *core.Username) *core.Node {
	if node.FrontMatter.AccessControl != nil {
		if node.FrontMatter.AccessControl.PublicRead {
			return &node
		} else if username != nil {
			if _, exists := node.FrontMatter.AccessControl.Users[*username]; exists {
				return &node
			}
		}
	}
	return nil
}

// Convert the named access control mode into a number.
// Starting from least permissive: 0.
//
// Only for use in comparisons, numbers may not be stable across updates.
func accessControlModeToLevelNumber(mode core.AccessControlMode) uint {
	switch mode {
	case core.AccessControlWriteMode:
		return 1
	default:
		return 0
	}
}

func selectMostPermissiveAcMode(
	mode1 core.AccessControlMode,
	mode2 core.AccessControlMode,
) core.AccessControlMode {
	mode1Level := accessControlModeToLevelNumber(mode1)
	mode2Level := accessControlModeToLevelNumber(mode2)
	if mode1Level > mode2Level {
		return mode1
	}
	return mode2
}

// Updates base access control in-place with the most permissive rules.
func updateMostPermissivePermissions(acBase *core.AccessControl, newAc core.AccessControl) {
	if newAc.PublicRead {
		acBase.PublicRead = true
	}
	for username, perm := range newAc.Users {
		existingPerm, exists := acBase.Users[username]
		if exists {
			acBase.Users[username] = selectMostPermissiveAcMode(perm, existingPerm)
		} else {
			acBase.Users[username] = perm
		}
	}
}

// Get the complete access control permissions for given node.
//
// Will search from top-level down to the given node,
// selecting the most permissive permissions available.
//
// Enable `useParentFallback` when node may not exist (like when creating a note).
func GetNodeAccessControl(
	tree core.NodeTree,
	fullSlug core.NodeSlug,
	useParentFallback bool,
) (core.AccessControl, error) {
	ac := core.AccessControl{
		PublicRead: false,
		Users:      make(map[core.Username]core.AccessControlMode),
	}
	slugParts := strings.Split(string(fullSlug), "/")
	var currentNode *core.Node
	// handle top-level
	if node, exists := tree[core.NodeSlug(slugParts[0])]; exists {
		if node.FrontMatter.AccessControl != nil {
			updateMostPermissivePermissions(&ac, *node.FrontMatter.AccessControl)
		}
		currentNode = node
	} else {
		// never use `useParentFallback`, top node has no parent
		return core.AccessControl{}, core.ErrNotFound
	}
	// handle further nodes
	for _, slugPart := range slugParts[1:] {
		slugPart := core.NodeSlug(slugPart)
		if _, exists := currentNode.Children[slugPart]; exists {
			if currentNode.FrontMatter.AccessControl != nil {
				updateMostPermissivePermissions(&ac, *currentNode.FrontMatter.AccessControl)
			}
			currentNode = currentNode.Children[slugPart]
		} else {
			if useParentFallback {
				return ac, nil
			}
			return core.AccessControl{}, core.ErrNotFound
		}
	}
	if currentNode == nil && !useParentFallback {
		return core.AccessControl{}, core.ErrNotFound
	}
	return ac, nil
}
