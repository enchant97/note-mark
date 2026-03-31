import { action, useAction, useNavigate, useParams, useSubmission } from "@solidjs/router"
import { batch, createResource, createSignal, Show } from "solid-js";
import Breadcrumb from "~/components/Breadcrumb";
import Icon from "~/components/Icon";
import LoadingRing from "~/components/loading/LoadingRing";
import AssetsModal, { AssetEntry } from "~/components/modals/Assets";
import CreateNoteModal from "~/components/modals/CreateNote";
import PrintModal from "~/components/modals/Print";
import UpdateNoteModal from "~/components/modals/UpdateNote";
import Note, { NoteMode } from "~/components/note/Note";
import { useModal } from "~/contexts/ModalProvider";
import { useNodeTree } from "~/contexts/NodeTreeProvider";
import { useSession } from "~/contexts/SessionProvider";
import { ToastType, useToast } from "~/contexts/ToastProvider";
import Api from "~/core/api";
import { copyToClipboard, download, StringSource } from "~/core/helpers";
import { createNoteEngine } from "~/core/note-engine";
import StorageHandler from "~/core/storage"
import type { NodeEntry, NodeSlug } from "~/core/types";

function NoteNode() {
  const params = useParams<{
    username: string,
    encodedFullSlug: string,
  }>()
  const decodedFullSlug = () => decodeURI(params.encodedFullSlug)
  const nodeTree = useNodeTree()
  const noteEngine = createNoteEngine()
  const { setModal, clearModal } = useModal()
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const { userInfo } = useSession()
  const [noteModeSetting, setNoteModeSetting] = StorageHandler.createSettingSignal("note_mode", false)
  const noteSlug = () => {
    return decodedFullSlug().split("/").pop()
  }
  const noteMode = () => {
    let stored = noteModeSetting() as NoteMode | null
    if (stored === null) {
      return NoteMode.RENDERED
    }
    return stored
  }
  const hasWritePermission = () => {
    const username = userInfo()?.preferred_username
    if (params.username === username) { return true }
    return nodeTree.getNodeAccessControlMode(decodedFullSlug(), username) === "write"
  }
  const [rawNoteContent] = createResource(
    () => [params.username, decodedFullSlug()],
    async ([username, fullSlug]) => {
      const content = await Api.getNodeContent(username, fullSlug)
      if (content instanceof Blob) { throw new Error("expected a note node") }
      noteEngine.tryFromRaw(content)
      return content
    })
  const [saved, setSaved] = createSignal(true)
  const saveAction = action(async (content: string) => {
    noteEngine.setContent(content)
    const newRawNote = noteEngine.tryIntoRaw()
    Api.updateNodeContent(params.username, decodedFullSlug(), newRawNote)
    setSaved(true)
    return { ok: true }
  })
  const saveSubmission = useSubmission(saveAction)
  const save = useAction(saveAction)

  const onCreateNoteClick = () => {
    setModal({
      component: CreateNoteModal,
      props: {
        currentUsername: params.username,
        currentFullSlug: decodedFullSlug(),
        onClose: (nodeEntry?: NodeEntry) => {
          clearModal()
          if (nodeEntry) {
            nodeTree.insertNode(nodeEntry)
            navigate(`/${params.username}/${nodeEntry.fullSlug}`)
          }
        },
      },
    })
  }

  const onSettingsClick = () => {
    setModal({
      component: UpdateNoteModal,
      props: {
        currentUsername: params.username,
        currentFullSlug: decodedFullSlug(),
        currentFrontmatter: noteEngine.frontmatter(),
        onClose: (nodeEntry?: NodeEntry | null) => {
          clearModal()
          if (nodeEntry) {
            if (nodeEntry.fullSlug === decodedFullSlug()) {
              // only frontmatter was changed
              noteEngine.setFrontmatter(nodeEntry.frontmatter!)
              nodeTree.insertNode(nodeEntry)
            } else {
              // note was renamed and possibility frontmatter was updated
              nodeTree.renameNode(decodedFullSlug(), nodeEntry)
              if (nodeEntry.fullSlug.startsWith(".trash/")) {
                navigate(`/${params.username}`)
              } else {
                navigate(`/${params.username}/${nodeEntry.fullSlug}`)
              }
            }
          } else if (nodeEntry === null) {
            // note was permanently deleted
            nodeTree.deleteNode(decodedFullSlug())
            navigate(`/${params.username}`)
          }
        },
      },
    })
  }

  const onAssetsClick = () => {
    const currentNode = nodeTree.tryGetNode(decodedFullSlug())
    if (currentNode === null || currentNode.type !== "note") { return }
    const assetEntries = Object
      .values(currentNode.children)
      .filter((v) => v.type === "asset")
      .reduce((obj, item) => (obj[item.slug] = {
        fullSlug: `${decodedFullSlug()}/${item.slug}`,
        modTime: item.modTime,
      }, obj), {})
    setModal({
      component: AssetsModal,
      props: {
        currentUsername: params.username,
        currentParentSlug: decodedFullSlug(),
        assets: assetEntries,
        onClose: (newAssets: Record<NodeSlug, AssetEntry>) => {
          clearModal()
          batch(() => {
            for (const [slug, entry] of Object.entries(newAssets)) {
              const currentAssetFullSlug = `${decodedFullSlug()}/${slug}`
              if (entry.fullSlug === null) {
                // handle permanent deletion
                nodeTree.deleteNode(currentAssetFullSlug)
              } else if (entry.fullSlug !== currentAssetFullSlug) {
                // handle asset rename/move
                nodeTree.renameNode(currentAssetFullSlug, {
                  fullSlug: entry.fullSlug,
                  nodeType: "asset",
                  modTime: entry.modTime,
                })
              } else if (nodeTree.tryGetNode(entry.fullSlug) === null) { // TODO make a doesNodeExist function (reduce mem allocations)
                // handle new asset
                nodeTree.insertNode({
                  fullSlug: entry.fullSlug,
                  nodeType: "asset",
                  modTime: entry.modTime,
                })
              }
            }
          })
        },
      },
    })
  }

  const onShareClick = async () => {
    try {
      await copyToClipboard(location.href)
      pushToast({ message: "copied to clipboard", type: ToastType.SUCCESS })
    } catch (err) {
      pushToast({ message: err.message, type: ToastType.ERROR })
    }
  }

  const onPrintClick = async () => {
    setModal({
      component: PrintModal,
      props: {
        onClose: clearModal,
        noteEngine,
      },
    })
  }

  return (
    <div class="flex flex-col gap-4 mt-6">
      <div class="flex gap-4 flex-col sm:flex-row">
        <menu class="menu menu-horizontal">
          <Show when={hasWritePermission()}>
            <li>
              <button
                onclick={onCreateNoteClick}
                type="button"
                title="Create New Note"
              >
                <Icon name="file-plus" />
                New
              </button>
            </li>
            <li><button
              onclick={onSettingsClick}
              type="button"
              title="Note Settings"
            >
              <Icon name="settings" />
              Settings
            </button></li>
            <li><button
              onClick={onAssetsClick}
              type="button"
              title="Note Assets"
            >
              <Icon name="image" />
              Assets
            </button></li>
          </Show>
          <li><details class="dropdown">
            <summary><Icon name="more-horizontal" /></summary>
            <ul class="p-2 menu dropdown-content z-1 w-52 backdrop-glass">
              <li><button
                onClick={(ev) => {
                  onShareClick()
                  ev.currentTarget.closest("details")?.removeAttribute("open")
                }}
                type="button"
                classList={{ "hidden": !window.isSecureContext }}
              >
                <Icon name="link" />
                Copy Page Link
              </button></li>
              <li><button
                onClick={(ev) => {
                  let content = noteEngine.tryIntoRaw()
                  if (content) {
                    download(
                      new StringSource(content, "text/markdown"),
                      `${noteSlug()}.md`,
                    )
                  }
                  ev.currentTarget.closest("details")?.removeAttribute("open")
                }}
                type="button"
              >
                <Icon name="download" />
                Download Note
              </button></li>
              <li><button
                onClick={(ev) => {
                  onPrintClick()
                  ev.currentTarget.closest("details")?.removeAttribute("open")
                }}
                type="button"
              >
                <Icon name="printer" />
                Print Note
              </button></li>
            </ul>
          </details></li>
        </menu>
        <Breadcrumb class="flex-1" username={params.username} fullSlug={decodedFullSlug()} />
      </div>
      <Show when={!rawNoteContent.loading} fallback={<LoadingRing />}>
        <Note
          noteEngine={noteEngine}
          mode={noteMode()}
          setMode={(mode) => {
            if (mode === NoteMode.RENDERED) { setNoteModeSetting(null) }
            else { setNoteModeSetting(mode) }
          }}
          isEditAllowed={hasWritePermission()}
          onSave={(content) => save(content)}
          saved={saved}
          setSaved={setSaved}
          saving={() => saveSubmission.pending ?? false}
        />
      </Show>
    </div>
  );
}

export default function Node() {
  // TODO support asset node
  return <NoteNode />
}
