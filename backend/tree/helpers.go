package tree

import "github.com/enchant97/note-mark/backend/core"

// Filter a node tree by using the AccessControl data.
func FilteredNodeTree(tree core.NodeTree, username *core.Username) core.NodeTree {
	filteredMap := core.NodeTree{}
	for _, node := range tree {
		if filteredNode := FilteredNode(node, username); filteredNode != nil {
			filteredMap[node.Slug] = node
		}
		if node.FrontMatter.AccessControl != nil {
			if node.FrontMatter.AccessControl.PublicRead {
				filteredMap[node.Slug] = node
			} else if username != nil {
				if _, exists := node.FrontMatter.AccessControl.Users[*username]; exists {
					filteredMap[node.Slug] = node
				}
			}
		}
	}
	return filteredMap
}

func FilteredNode(node *core.Node, username *core.Username) *core.Node {
	if node == nil {
		return nil
	}
	var filteredNode *core.Node = nil
	// filter top level node
	if node.FrontMatter.AccessControl != nil {
		if node.FrontMatter.AccessControl.PublicRead {
			filteredNode = node
		} else if username != nil {
			if _, exists := node.FrontMatter.AccessControl.Users[*username]; exists {
				filteredNode = node
			}
		}
	}
	// filter children
	if filteredNode != nil && filteredNode.Type == "note" {
		for _, childNode := range filteredNode.Children {
			if childNode.Type == "note" {
				newChild := FilteredNode(childNode, username)
				if newChild == nil {
					delete(filteredNode.Children, childNode.Slug)
				} else {
					filteredNode.Children[childNode.Slug] = newChild
				}
			}
		}
	}
	return filteredNode
}
