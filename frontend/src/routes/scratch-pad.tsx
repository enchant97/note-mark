import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import Header from "~/components/Header";
import Note, { NoteMode } from "~/components/note/Note";
import { EditorState } from "~/components/editor/Editor";
import StorageHandler from "~/core/storage";
import Icon from "~/components/Icon";
import { useSession } from "~/contexts/SessionProvider";
import { createNoteEngine } from "~/core/note-engine";

const SCRATCH_PAD_CONTENT_KEY = "scratch_pad_content"

function readContent(): string {
  return StorageHandler.readSetting(SCRATCH_PAD_CONTENT_KEY) || ""
}

function writeContent(content: string, isAuthenticated: boolean) {
  StorageHandler.writeSetting(SCRATCH_PAD_CONTENT_KEY, content, isAuthenticated)
}

export default function ScratchPad() {
  const { userInfo } = useSession()
  const noteEngine = createNoteEngine(readContent())
  const [mode, setMode] = createSignal(NoteMode.EDIT)
  const [state, setState] = createStore<EditorState>({
    saving: false,
    unsaved: false,
  })

  const onSave = (content: string) => {
    writeContent(content, userInfo() !== undefined)
    setState({ unsaved: false, saving: false })
    noteEngine.setContent(content)
  }

  return (
    <div class="min-h-screen">
      <Header disableDrawerToggle={true} />
      <h1 class="text-4xl font-bold mb-4 flex justify-center items-center gap-2 mx-auto">
        <Icon name="file-text" />
        Scratch Pad
      </h1>
      <div class="px-6">
        <Note
          noteEngine={noteEngine}
          mode={mode()}
          setMode={setMode}
          isEditAllowed={true}
          state={state}
          setState={setState}
          onSave={onSave}
        />
      </div>
    </div>
  )
}
