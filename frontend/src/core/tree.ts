import type { Frontmatter, NodeEntry, NodeTree, NodeTreeNode } from "./types"

/**
 * In-memory insertion of a node
 */
export function insertNode(nodeTree: NodeTree, nodeEntry: NodeEntry) {
  const slugParts = nodeEntry.fullSlug.split("/")
  let currentNode: NodeTreeNode
  // handle top level node
  if (Object.hasOwn(nodeTree, slugParts[0])) {
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
      if (!Object.hasOwn(currentNode.children, slugPart)) {
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

/**
 * In-memory rename of a node, also updating frontmatter
 */
export function renameNode(nodeTree: NodeTree, currentFullSlug: string, nodeEntry: NodeEntry) {
  insertNode(nodeTree, nodeEntry)
  deleteNode(nodeTree, currentFullSlug)
}

/**
 * Try and get node from in-memory store.
 */
export function tryGetNode(nodeTree: NodeTree, fullSlug: string) {
  const slugParts = fullSlug.split("/")
  const topSlug = slugParts.shift()
  if (topSlug === undefined) { return null }
  let currentNode: NodeTreeNode
  // handle top level node
  if (Object.hasOwn(nodeTree, topSlug)) {
    currentNode = nodeTree[topSlug]
  } else { return null }
  // handle further nodes
  for (const slugPart of slugParts) {
    if (currentNode.type === "note" && Object.hasOwn(currentNode.children, slugPart)) {
      currentNode = currentNode.children[slugPart]
    } else { return null }
  }
  return currentNode
}

/**
 * In-memory deletion of a node and any children
 */
export function deleteNode(nodeTree: NodeTree, fullSlug: string) {
  console.log(nodeTree)
  const slugParts = fullSlug.split("/")
  const nodeSlug = slugParts.pop()
  if (!nodeSlug) {
    throw "not enough slug parts"
  }
  if (slugParts.length === 0) {
    if (!Object.hasOwn(nodeTree, nodeSlug)) {
      throw "not found"
    }
    delete nodeTree[nodeSlug]
    return
  }
  let currentNode: NodeTreeNode
  // handle top level node
  if (Object.hasOwn(nodeTree, slugParts[0])) {
    currentNode = nodeTree[slugParts[0]]
  } else { throw "not found" }
  // handle further nodes
  if (slugParts.shift() !== undefined) {
    for (const slugPart of slugParts) {
      if (currentNode.type !== "note") {
        throw `node of type '${currentNode.type}' expected 'note'`
      }
      if (!Object.hasOwn(currentNode.children, slugPart)) {
        throw "not found"
      }
      currentNode = currentNode.children[slugPart]
    }
  }
  // reached target, delete the node
  if (currentNode.type !== "note") {
    throw `node of type '${currentNode.type}' expected 'note'`
  }
  delete currentNode.children[nodeSlug]
}
