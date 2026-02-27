import { createResource, createSignal, ParentProps, Show } from "solid-js";
import Header from '~/components/Header';
import LoadingRing from "./loading/LoadingRing";
import TreeNavigator from 'solid-tree-navigator';
import Icon, { FileIcon, FolderIcon } from '~/components/Icon';
import { useParams } from "@solidjs/router";
import Api from "~/core/api";
import { NodeTree } from "~/core/types";
import SortSelect, { SortChoice } from "./input/SortSelect";

function nodeTreeIntoNodeList(tree: NodeTree, username: string, parentSlug?: string) {
  return Object.values(tree).filter((node) => node.type === "note").map((node) => {
    const fullSlug = parentSlug
      ? `${parentSlug}/${node.slug}`
      : node.slug
    const href = `/${username}/${fullSlug}`
    const children = nodeTreeIntoNodeList(node.children, username, fullSlug)
    return {
      title: node.title || node.slug,
      fullSlug,
      href,
      ...(children.length ? { nodes: children } : {})
    }
  })
}

function sortNodeTreeList(nodes: any[], method: SortChoice): any[] {
  const sortedChildren = nodes
    .map(node => ({
      ...node,
      ...(node.nodes?.length ? { nodes: sortNodeTreeList(node.nodes, method) } : {})
    }))
  switch (method) {
    case SortChoice.NAME_ASC:
      return sortedChildren.sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base', numeric: true }))
    case SortChoice.NAME_DEC:
      return sortedChildren.sort((a, b) => b.title.localeCompare(a.title, 'en', { sensitivity: 'base', numeric: true }))
    /* TODO add this back when nodes have timestamps
    case SortChoice.UPDATED_ASC:
      return sortedChildren.sort((a, b) => compare(a.updatedAt, b.updatedAt))
    case SortChoice.UPDATED_DEC:
      return sortedChildren.sort((a, b) => compare(b.updatedAt, a.updatedAt))
    case SortChoice.CREATED_ASC:
      return sortedChildren.sort((a, b) => compare(a.createdAt, b.createdAt))
    case SortChoice.CREATED_DEC:
      return sortedChildren.sort((a, b) => compare(b.createdAt, a.createdAt))
    */
    default:
      return sortedChildren
  }
}

export default function MainApp({ children }: ParentProps) {
  const params = useParams<{
    username: string,
    fullSlug: string,
  }>()
  const [sortChoice, setSortChoice] = createSignal(SortChoice.NAME_ASC)
  const [nodeTree] = createResource(() => params.username, async (username) => {
    return await Api.getNodeTree(username)
  })
  const nodeTreeList = () => {
    if (nodeTree.loading) { return }
    return nodeTreeIntoNodeList(nodeTree() ?? {}, params.username)
  }
  const nodeTreeListSorted = () => {
    const nodes = nodeTreeList()
    if (nodes === undefined) { return }
    const startTime = performance.now()
    const items = sortNodeTreeList(nodes, sortChoice())
    const endTime = performance.now()
    console.debug(`sorting node tree took ${endTime - startTime}ms`)
    return items
  }

  return (
    <div class="drawer lg:drawer-open">
      <input id="main-drawer" type="checkbox" class="drawer-toggle" />
      <div class="drawer-content min-h-screen pb-8">
        <Header />
        <div class="px-2 mt-2">
          {children}
        </div>
      </div>
      <div class="drawer-side z-40 p-2">
        <label for="main-drawer" class="drawer-overlay"></label>
        <div class="h-full rounded-box backdrop-glass">
          <menu class="menu gap-2 p-4 w-80 h-full">
            <li><label aria-label="Sort Mode">
              <Icon name="align-left" />
              <SortSelect name="drawerSortMode" onChange={setSortChoice} selected={sortChoice()} />
            </label></li>
            <li class="menu-title flex flex-row">
              <span class="flex-1">NOTEBOOKS</span>
            </li>
            <ul class="p-2 flex-1 overflow-auto bg-base-100 shadow-glass rounded-box">
              <Show when={nodeTreeListSorted} fallback={<LoadingRing />}>{(nodeTree) => (
                <TreeNavigator
                  nodes={nodeTree()}
                  fileIcon={FileIcon}
                  folderIcon={FolderIcon}
                />
              )}
              </Show>
            </ul>
            <li>
              <a
                href="https://buymeacoffee.com/leospratt"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-sm shadow bg-base-100"
              >
                Support My Work (Donate)
              </a>
            </li>
            <li>
              <a
                href="https://github.com/enchant97/note-mark"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm block leading-relaxed"
              >
                Powered By
                <span class="font-bold"> Note Mark</span>
                <br />
                Licensed Under AGPL-3.0
              </a>
            </li>
          </menu>
        </div>
      </div>
    </div>
  );
}
