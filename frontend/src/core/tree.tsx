import type { Frontmatter, NodeTree, NodeTreeNode } from "./types"

/**
 * In-memory insertion of node
 */
export function insertNode(nodeTree: NodeTree, fullSlug: string, frontmatter: Frontmatter) {
  const slugParts = fullSlug.split("/")
  let currentNode: NodeTreeNode
  // handle top level node
  if (nodeTree.hasOwnProperty(slugParts[0])) {
    currentNode = nodeTree[slugParts[0]]
  } else {
    const newNode: NodeTreeNode = {
      slug: slugParts[0],
      modTime: (new Date()).toISOString(),
      type: "note",
      title: "",
      children: {},
    }
    nodeTree[slugParts[0]] = newNode
    currentNode = newNode
  }
  // handle further nodes
  if (slugParts.shift() !== undefined) {
    for (const slugPart of slugParts) {
      if (!currentNode.hasOwnProperty(slugPart)) {
        // node needs creation
        currentNode.children[slugPart] = {
          slug: slugPart,
          modTime: (new Date()).toISOString(),
          type: "note", // TODO handle all node types
          title: "",
          children: {},
        }
      }
      currentNode = currentNode.children[slugPart]
    }
  }
  // reached our target node
  currentNode.modTime = (new Date()).toISOString()
  Object.assign(currentNode, frontmatter)
}
