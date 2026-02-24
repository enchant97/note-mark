import { useParams } from "@solidjs/router"
import { createResource, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { EditorState } from "~/components/editor/Editor";
import LoadingRing from "~/components/loading/LoadingRing";
import Note, { NoteMode } from "~/components/note/Note";
import Api from "~/core/api";
import StorageHandler from "~/core/storage"

function NoteNode() {
  const params = useParams<{
    username: string,
    fullSlug: string,
  }>()
  const [noteModeSetting, setNoteModeSetting] = StorageHandler.createSettingSignal("note_mode", false)
  const noteMode = () => {
    let stored = noteModeSetting() as NoteMode | null
    if (stored === null) {
      return NoteMode.RENDERED
    }
    return stored
  }
  const [noteContent, { mutate: setNoteContent }] = createResource(
    () => [params.username, params.fullSlug],
    async ([username, fullSlug]) => {
      const content = await Api.getNodeContent(username, fullSlug)
      if (content instanceof Blob) { throw new Error("expected a note node") }
      return content
    })
  const [state, setState] = createStore<EditorState>({
    saving: false,
    unsaved: false,
  })

  const save = async (content: string) => {
    setState({ saving: false, unsaved: false })
    setNoteContent(content)
  }

  return (
    <div class="flex flex-col gap-4 mt-6">
      <div class="flex gap-4 flex-col sm:flex-row">
        <menu class="menu menu-horizontal">
        </menu>
      </div>
      <Show when={!noteContent.loading} fallback={<LoadingRing />}>
        <Note
          mode={noteMode()}
          setMode={(mode) => {
            if (mode === NoteMode.RENDERED) { setNoteModeSetting(null) }
            else { setNoteModeSetting(mode) }
          }}
          content={() => noteContent() || ""}
          setContent={setNoteContent}
          isEditAllowed={true}
          state={state}
          setState={setState}
          onSave={(content) => save(content)}
        />
      </Show>
    </div>
  );
}

export default function Node() {
  // TODO support asset node
  return <NoteNode />
}
