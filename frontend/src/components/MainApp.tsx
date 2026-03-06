import { createResource, createSignal, ParentProps, Show } from "solid-js";
import Header from '~/components/Header';
import LoadingRing from "./loading/LoadingRing";
import TreeNavigator from 'solid-tree-navigator';
import Icon, { FileIcon, FolderIcon } from '~/components/Icon';
import { useNavigate, useParams } from "@solidjs/router";
import Api from "~/core/api";
import { NodeEntry, NodeTree } from "~/core/types";
import SortSelect, { SortChoice } from "./input/SortSelect";
import { NodeTreeProvider } from "~/contexts/NodeTreeProvider";
import { useModal } from "~/contexts/ModalProvider";
import ContentSearchModal from "./modals/ContentSearch";
import { compare } from "~/core/helpers";
import CreateNoteModal from "./modals/CreateNote";
import { insertNode } from "~/core/tree";

interface NodeListItem {
  title: string
  fullSlug: string
  modTime: string
  href: string
  nodes?: NodeListItem[]
}

function nodeTreeIntoNotesList(tree: NodeTree, username: string, parentSlug?: string): NodeListItem[] {
  return Object.values(tree).filter((node) => node.type === "note").map((node) => {
    const fullSlug = parentSlug
      ? `${parentSlug}/${node.slug}`
      : node.slug
    const href = `/${username}/${fullSlug}`
    const children = nodeTreeIntoNotesList(node.children, username, fullSlug)
    return {
      title: node.frontmatter.title || node.slug,
      fullSlug,
      href,
      modTime: node.modTime,
      ...(children.length ? { nodes: children } : {})
    }
  })
}

function sortNotesList(nodes: NodeListItem[], method: SortChoice): NodeListItem[] {
  const sortedChildren = nodes
    .map(node => ({
      ...node,
      ...(node.nodes?.length ? { nodes: sortNotesList(node.nodes, method) } : {})
    }))
  switch (method) {
    case SortChoice.NAME_ASC:
      return sortedChildren.sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base', numeric: true }))
    case SortChoice.NAME_DEC:
      return sortedChildren.sort((a, b) => b.title.localeCompare(a.title, 'en', { sensitivity: 'base', numeric: true }))
    case SortChoice.MOD_TIME_ASC:
      return sortedChildren.sort((a, b) => compare(a.modTime, b.modTime))
    case SortChoice.MOD_TIME_DEC:
      return sortedChildren.sort((a, b) => compare(b.modTime, a.modTime))
    default:
      return sortedChildren
  }
}

function flattenNodesList(nodes: NodeListItem[]): NodeListItem[] {
  return nodes.flatMap(({ nodes = [], ...rest }) => [rest, ...flattenNodesList(nodes)])
}

export default function MainApp(props: ParentProps) {
  const params = useParams<{
    username: string,
    fullSlug: string,
  }>()
  const { setModal, clearModal } = useModal()
  const navigate = useNavigate()
  const [sortChoice, setSortChoice] = createSignal(SortChoice.NAME_ASC)
  const [nodeTree, { mutate: setNodeTree }] = createResource(() => params.username, async (username) => {
    return await Api.getNodeTree(username)
  })
  const notesList = () => {
    if (nodeTree.loading) { return }
    const { ".trash": _, ...tree } = nodeTree() ?? {}
    return nodeTreeIntoNotesList(tree, params.username)
  }
  const notesListSorted = () => {
    const nodes = notesList()
    if (nodes === undefined) { return }
    const startTime = performance.now()
    const items = sortNotesList(nodes, sortChoice())
    const endTime = performance.now()
    console.debug(`[PERF] sorting node tree took ${endTime - startTime}ms`)
    return items
  }

  const onContentSearchClick = () => {
    let sortedItems = flattenNodesList(notesList() ?? [])
      .map((node) => ({ title: node.title, href: node.href }))
      .sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base', numeric: true }))
    setModal({
      component: ContentSearchModal,
      props: {
        sortedItems,
        onClose: (item?: { href: string }) => {
          clearModal()
          if (item === undefined) { return }
          navigate(item.href)
        },
      },
    })
  }

  const onCreateNoteClick = () => {
    setModal({
      component: CreateNoteModal,
      props: {
        currentUsername: params.username,
        onClose: (nodeEntry?: NodeEntry) => {
          clearModal()
          if (nodeEntry) {
            const newNodeTree = structuredClone(nodeTree()!)
            insertNode(newNodeTree, nodeEntry)
            setNodeTree(newNodeTree)
            navigate(`/${params.username}/${nodeEntry.fullSlug}`)
          }
        },
      },
    })
  }

  return (
    <div class="drawer lg:drawer-open">
      <input id="main-drawer" type="checkbox" class="drawer-toggle" />
      <div class="drawer-content min-h-screen pb-8">
        <Header />
        <div class="px-2 mt-2">
          <Show when={!nodeTree.loading} fallback={<LoadingRing />}>
            <NodeTreeProvider
              nodeTree={() => nodeTree()!}
              setNodeTree={(tree: NodeTree) => setNodeTree(tree)}
            >
              {props.children}
            </NodeTreeProvider>
          </Show>
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
            <li><button
              onClick={() => onContentSearchClick()}
              class="btn btn-sm"
              type="button">
              <Icon name="search" />
              Search
            </button></li>
            <li class="menu-title flex flex-row items-center">
              <span class="flex-1">NOTEBOOKS</span>
              <button
                class="btn btn-sm"
                title="New Note"
                onClick={onCreateNoteClick}
              ><Icon name="file-plus" /></button>
            </li>
            <ul class="p-2 flex-1 overflow-auto bg-base-100 shadow-glass rounded-box">
              <Show when={notesListSorted} fallback={<LoadingRing />}>{(nodeTree) => (
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
