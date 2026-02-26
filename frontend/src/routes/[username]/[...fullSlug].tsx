import { action, useAction, useParams, useSubmission } from "@solidjs/router"
import { createEffect, createResource, createSignal, Show } from "solid-js";
import LoadingRing from "~/components/loading/LoadingRing";
import Note, { NoteMode } from "~/components/note/Note";
import Api from "~/core/api";
import { createNoteEngine } from "~/core/note-engine";
import StorageHandler from "~/core/storage"

function NoteNode() {
  const params = useParams<{
    username: string,
    fullSlug: string,
  }>()
  const noteEngine = createNoteEngine()
  const [noteModeSetting, setNoteModeSetting] = StorageHandler.createSettingSignal("note_mode", false)
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

  return (
    <div class="flex flex-col gap-4 mt-6">
      <div class="flex gap-4 flex-col sm:flex-row">
        <menu class="menu menu-horizontal">
        </menu>
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
