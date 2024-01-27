import { Component, createSignal } from "solid-js";
import Header from "../components/header";
import Note, { NoteMode } from "../components/note";
import { createStore } from "solid-js/store";
import { EditorState } from "../components/editor/editor";
import StorageHandler from "../core/storage";
import { useCurrentUser } from "../contexts/CurrentUserProvider";
import Icon from "../components/icon";

const SCRATCH_PAD_CONTENT_KEY = "scratch_pad_content"

function readContent(): string {
  return StorageHandler.readSetting(SCRATCH_PAD_CONTENT_KEY) || ""
}

function writeContent(content: string, isAuthenticated: boolean) {
  StorageHandler.writeSetting(SCRATCH_PAD_CONTENT_KEY, content, isAuthenticated)
}

const ScratchPad: Component = () => {
  const { user } = useCurrentUser()

  const [mode, setMode] = createSignal(NoteMode.EDIT)
  const [content, setContent] = createSignal(readContent())
  const [state, setState] = createStore<EditorState>({
    saving: false,
    unsaved: false,
  })

  const onSave = (content: string) => {
    writeContent(content, user() !== undefined)
    setState({ unsaved: false, saving: false })
    setContent(content)
  }

  return (
    <div class="min-h-screen">
      <Header />
      <h1 class="text-4xl font-bold mb-4 flex justify-center items-center gap-2 mx-auto">
        <Icon name="file-text" />
        Scratch Pad
      </h1>
      <div class="px-6">
        <Note
          mode={mode()}
          setMode={setMode}
          content={content}
          setContent={setContent}
          isEditAllowed={true}
          state={state}
          setState={setState}
          onSave={onSave}
        />
      </div>
    </div>
  )
}

export default ScratchPad
