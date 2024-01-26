import { Component, createSignal } from "solid-js";
import Header from "../components/header";
import Note, { NoteMode } from "../components/note";
import { createStore } from "solid-js/store";
import { EditorState } from "../components/editor/editor";
import StorageHandler from "../core/storage";

const ScratchPad: Component = () => {
  const [mode, setMode] = createSignal(NoteMode.EDIT)
  const [content, setContent] = createSignal(StorageHandler.readSetting("scratch_pad") || "")

  const [state, setState] = createStore<EditorState>({
    saving: false,
    unsaved: false,
  })

  return (
    <div class="min-h-screen">
      <Header />
      <div class="px-6">
        <Note
          mode={mode()}
          setMode={setMode}
          content={content}
          setContent={setContent}
          isEditAllowed={true}
          state={state}
          setState={setState}
          onSave={(content) => {
            StorageHandler.writeSetting("scratch_pad", content, false)
            setState({ unsaved: false, saving: false })
            setContent(content)
          }}
        />
      </div>
    </div>
  )
}

export default ScratchPad
