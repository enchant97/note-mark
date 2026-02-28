import type { Frontmatter, NodeEntry, NodeTree, NodeTreeNode } from "./types"

/**
 * In-memory insertion of a node
 */
export function insertNode(nodeTree: NodeTree, nodeEntry: NodeEntry) {
  const slugParts = nodeEntry.fullSlug.split("/")
  let currentNode: NodeTreeNode
  // handle top level node
  if (nodeTree.hasOwnProperty(slugParts[0])) {
    currentNode = nodeTree[slugParts[0]]
  } else {
    const newNode: NodeTreeNode = {
      slug: slugParts[0],
      modTime: nodeEntry.modTime,
      type: "note",
      frontmatter: {},
      children: {},
    }
    nodeTree[slugParts[0]] = newNode
    currentNode = newNode
  }
  // handle further nodes
  if (slugParts.shift() !== undefined) {
    for (const slugPart of slugParts) {
      if (currentNode.type !== "note") {
        throw new Error(`node of type '${currentNode.type}' expected 'note'`)
      }
      // XXX requires modern browsers (2022), maybe polyfill with core-js
      if (!Object.hasOwn(currentNode, slugPart)) {
        // node needs creation, create a default note node
        currentNode.children[slugPart] = {
          slug: slugPart,
          modTime: nodeEntry.modTime,
          type: "note",
          frontmatter: {},
          children: {},
        }
      }
      currentNode = currentNode.children[slugPart]
    }
  }
  // reached our target node, apply correct fields
  currentNode.type = nodeEntry.nodeType
  currentNode.modTime = nodeEntry.modTime
  if (currentNode.type === "note") {
    // we have a note node, add note note fields
    const frontmatter: Frontmatter = nodeEntry.frontmatter ?? {}
    const children: NodeTree = currentNode?.children ?? {}
    Object.assign(currentNode, { frontmatter, children })
  } else {
    // we have an asset node, remove note node fields
    delete currentNode["children"]
    delete currentNode["frontmatter"]
  }
}
