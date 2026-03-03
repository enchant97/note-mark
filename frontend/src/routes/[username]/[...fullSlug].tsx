import { action, useAction, useNavigate, useParams, useSubmission } from "@solidjs/router"
import { createEffect, createResource, createSignal, Show } from "solid-js";
import Breadcrumb from "~/components/Breadcrumb";
import Icon from "~/components/Icon";
import LoadingRing from "~/components/loading/LoadingRing";
import CreateNoteModal from "~/components/modals/CreateNote";
import PrintModal from "~/components/modals/Print";
import UpdateNoteModal from "~/components/modals/UpdateNote";
import Note, { NoteMode } from "~/components/note/Note";
import { useModal } from "~/contexts/ModalProvider";
import { useNodeTree } from "~/contexts/NodeTreeProvider";
import { ToastType, useToast } from "~/contexts/ToastProvider";
import Api from "~/core/api";
import { copyToClipboard, download, StringSource } from "~/core/helpers";
import { createNoteEngine } from "~/core/note-engine";
import StorageHandler from "~/core/storage"
import type { NodeEntry } from "~/core/types";

function NoteNode() {
  const params = useParams<{
    username: string,
    fullSlug: string,
  }>()
  const nodeTree = useNodeTree()
  const noteEngine = createNoteEngine()
  const { setModal, clearModal } = useModal()
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const [noteModeSetting, setNoteModeSetting] = StorageHandler.createSettingSignal("note_mode", false)
  const noteSlug = () => {
    return params.fullSlug.split("/").pop()
  }
  const noteMode = () => {
    let stored = noteModeSetting() as NoteMode | null
    if (stored === null) {
      return NoteMode.RENDERED
    }
    return stored
  }
  const [rawNoteContent] = createResource(
    () => [params.username, params.fullSlug],
    async ([username, fullSlug]) => {
      const content = await Api.getNodeContent(username, fullSlug)
      if (content instanceof Blob) { throw new Error("expected a note node") }
      return content
    })
  createEffect(() => {
    const raw = rawNoteContent()
    if (raw) { noteEngine.tryFromRaw(raw) }
  })
  const [saved, setSaved] = createSignal(true)
  const saveAction = action(async (content: string) => {
    noteEngine.setContent(content)
    const newRawNote = noteEngine.tryIntoRaw()
    Api.updateNodeContent(params.username, params.fullSlug, newRawNote)
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
        currentFullSlug: params.fullSlug,
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
        currentFullSlug: params.fullSlug,
        currentFrontmatter: noteEngine.frontmatter(),
        onClose: (nodeEntry?: NodeEntry) => {
          clearModal()
          if (nodeEntry) {
            if (nodeEntry.fullSlug === params.fullSlug) {
              // only frontmatter was changed
              noteEngine.setFrontmatter(nodeEntry.frontmatter!)
              // TODO update tree
            } else {
              // note was renamed
              // TODO update tree
              // TODO navigate to updated note or parent (if moved to trash)
            }
          }
        },
      },
    })
  }

  const onAssetsClick = () => {
    pushToast({ message: "WIP", type: ToastType.ERROR })
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
          <li><details class="dropdown">
            <summary><Icon name="more-horizontal" /></summary>
            <ul class="p-2 menu dropdown-content z-[1] w-52 backdrop-glass">
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
        <Breadcrumb class="flex-1" username={params.username} fullSlug={params.fullSlug} />
      </div>
      <Show when={!rawNoteContent.loading} fallback={<LoadingRing />}>
        <Note
          noteEngine={noteEngine}
          mode={noteMode()}
          setMode={(mode) => {
            if (mode === NoteMode.RENDERED) { setNoteModeSetting(null) }
            else { setNoteModeSetting(mode) }
          }}
          isEditAllowed={true}
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
