import { Accessor, createContext, ParentProps, useContext } from "solid-js"
import { optionExpect } from "~/core/helpers"
import { NodeTree } from "~/core/types";

interface NodeTreeContextProps {
  nodeTree: Accessor<NodeTree>
}

function makeNodeTreeContext({ nodeTree }: NodeTreeContextProps) {
  return {
    nodeTree
  } as const
}

type NodeTreeContextType = ReturnType<typeof makeNodeTreeContext>
const NodeTreeContext = createContext<NodeTreeContextType>()

export function useNodeTree() {
  const ctx = useContext(NodeTreeContext)
  return optionExpect(ctx, "node tree provider cannot be accessed")
}

interface NodeTreeProviderProps extends NodeTreeContextProps, ParentProps { }

export function NodeTreeProvider({ children, ...props }: NodeTreeProviderProps) {
  return (
    <NodeTreeContext.Provider value={makeNodeTreeContext(props)}>
      {children}
    </NodeTreeContext.Provider>
  )
}
