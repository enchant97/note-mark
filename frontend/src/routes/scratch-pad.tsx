import { Component, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import Header from "~/components/header";
import Note, { NoteMode } from "~/components/note";
import { EditorState } from "~/components/editor/editor";
import StorageHandler from "~/core/storage";
import Icon from "~/components/icon";
import Footer from "~/components/footer";
import { Context } from "~/core/renderer";
import { useApi } from "~/contexts/ApiProvider";

const SCRATCH_PAD_CONTENT_KEY = "scratch_pad_content"

function readContent(): string {
  return StorageHandler.readSetting(SCRATCH_PAD_CONTENT_KEY) || ""
}

function writeContent(content: string, isAuthenticated: boolean) {
  StorageHandler.writeSetting(SCRATCH_PAD_CONTENT_KEY, content, isAuthenticated)
}

const ScratchPad: Component = () => {
  const { userInfo } = useApi()

  const [mode, setMode] = createSignal(NoteMode.EDIT)
  const [content, setContent] = createSignal(readContent())
  const [state, setState] = createStore<EditorState>({
    saving: false,
    unsaved: false,
  })

  const onSave = (content: string) => {
    writeContent(content, userInfo() !== undefined)
    setState({ unsaved: false, saving: false })
    setContent(content)
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
          mode={mode()}
          setMode={setMode}
          content={content}
          setContent={setContent}
          context={() => new Context("Note", "Scratch Pad")}
          isEditAllowed={true}
          state={state}
          setState={setState}
          onSave={onSave}
        />
      </div>
      <Footer />
    </div>
  )
}

export default ScratchPad
