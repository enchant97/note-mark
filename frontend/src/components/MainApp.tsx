import { createResource, ParentProps, Show } from "solid-js";
import Header from '~/components/Header';
import LoadingRing from "./loading/LoadingRing";
import TreeNavigator from 'solid-tree-navigator';
import { FileIcon, FolderIcon } from '~/components/Icon';
import { useParams } from "@solidjs/router";
import Api from "~/core/api";
import { NodeTree } from "~/core/types";

function nodeTreeIntoNodeList(tree: NodeTree, parentPath?: string) {
  return Object.values(tree).filter((node) => node.type === "note").map((node) => {
    const href = parentPath
      ? `${parentPath}/${node.slug}`
      : `/${node.slug}`
    const children = nodeTreeIntoNodeList(node.children, href)
    return {
      title: node.title || node.slug,
      href,
      ...(children.length ? { nodes: children } : {})
    }
  })
}

export default function MainApp({ children }: ParentProps) {
  const params = useParams<{
    username: string,
    fullSlug: string,
  }>()

  const [nodeTree] = createResource(() => params.username, async (username) => {
    return await Api.getNodeTree(username)
  })

  const nodeTreeList = () => {
    if (nodeTree.loading) { return }
    return nodeTreeIntoNodeList(nodeTree() ?? {}, `/${params.username}`)
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
            <li class="menu-title flex flex-row">
              <span class="flex-1">NOTEBOOKS</span>
            </li>
            <ul class="p-2 flex-1 overflow-auto bg-base-100 shadow-glass rounded-box">
              <Show when={nodeTreeList()} fallback={<LoadingRing />}>
                <TreeNavigator
                  nodes={nodeTreeList}
                  fileIcon={FileIcon}
                  folderIcon={FolderIcon}
                />
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
