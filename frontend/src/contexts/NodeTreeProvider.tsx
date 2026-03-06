import { Accessor, createContext, ParentProps, useContext } from "solid-js"
import { optionExpect } from "~/core/helpers"
import { deleteNode, insertNode, renameNode } from "~/core/tree";
import type { NodeEntry, NodeTree } from "~/core/types";

interface NodeTreeContextProps {
  setNodeTree: (tree: NodeTree) => any
  nodeTree: Accessor<NodeTree>
}

function makeNodeTreeContext({ nodeTree, setNodeTree }: NodeTreeContextProps) {
  return {
    nodeTree,
    insertNode: (nodeEntry: NodeEntry) => {
      // XXX requires modern browsers (2022), maybe polyfill with core-js
      const newNodeTree = structuredClone(nodeTree())
      insertNode(newNodeTree, nodeEntry)
      setNodeTree(newNodeTree)
    },
    renameNode: (currentFullSlug: string, nodeEntry: NodeEntry) => {
      const newNodeTree = structuredClone(nodeTree())
      renameNode(newNodeTree, currentFullSlug, nodeEntry)
      setNodeTree(newNodeTree)
    },
    deleteNode: (fullSlug: string) => {
      const newNodeTree = structuredClone(nodeTree())
      deleteNode(newNodeTree, fullSlug)
      setNodeTree(newNodeTree)
    },
  } as const
}

type NodeTreeContextType = ReturnType<typeof makeNodeTreeContext>
const NodeTreeContext = createContext<NodeTreeContextType>()

export function useNodeTree() {
  const ctx = useContext(NodeTreeContext)
  return optionExpect(ctx, "node tree provider cannot be accessed")
}

interface NodeTreeProviderProps extends NodeTreeContextProps, ParentProps { }

export function NodeTreeProvider(props: NodeTreeProviderProps) {
  return (
    <NodeTreeContext.Provider value={makeNodeTreeContext(props)}>
      {props.children}
    </NodeTreeContext.Provider>
  )
}
