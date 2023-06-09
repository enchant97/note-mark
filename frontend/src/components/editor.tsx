import { EditorView, basicSetup } from "codemirror";
import { EditorState as InternalEditorState } from "@codemirror/state";
import { Component, createEffect, onMount } from "solid-js";
import { SetStoreFunction, Store } from "solid-js/store";
import { FiSave } from "solid-icons/fi";

const editorTheme = EditorView.baseTheme({
  "&.cm-editor": {
    "font-size": ".95rem",
  },
  ".cm-scroller": {
    "font-family": "monospace",
  },
  ".cm-gutters": {
    "background-color": "hsl(var(--b2))",
    "border-right": "hsl(var(--b2))",
  },
  ".cm-activeLineGutter": {
    "background-color": "hsl(var(--b3))",
  }
})

export type EditorState = {
  unsaved: boolean
  saving: boolean
}

export type EditorProps = {
  content: string
  autoSaveTimeout: number
  onSave: (content: string) => void
  state: Store<EditorState>
  setState: SetStoreFunction<EditorState>
}

const Editor: Component<EditorProps> = (props) => {
  let editorDiv: HTMLDivElement
  let editor: EditorView
  let autosaveTimeout: number;

  const save = (state: InternalEditorState) => {
    props.onSave(state.doc.toString())
  }

  const onInput = (state: InternalEditorState) => {
    props.setState({ unsaved: true })
    window.clearTimeout(autosaveTimeout)
    autosaveTimeout = window.setTimeout(
      save,
      props.autoSaveTimeout,
      state,
    )
  }

  const triggerSave = () => {
    window.clearTimeout(autosaveTimeout)
    save(editor.state)
  }

  createEffect(() => {
    let newContent = props.content
    if (editor !== undefined) {
      editor.dispatch({
        changes: {
          from: 0,
          to: editor.state.doc.length,
          insert: newContent,
        },
      })
    }
  })

  onMount(() => {
    editor = new EditorView({
      state: InternalEditorState.create({
        extensions: [
          basicSetup,
          EditorView.lineWrapping,
          editorTheme,
          EditorView.updateListener.of((v) => {
            if (v.docChanged) {
              onInput(v.state)
            }
          }),
        ],
        doc: props.content,
      }),
      parent: editorDiv,
    })
  })

  return (
    <>
      <ul class="menu menu-sm menu-horizontal gap-2 bg-base-200 rounded-md shadow-md p-2 w-full">
        <li><button
          class="btn btn-sm btn-square btn-outline"
          classList={{ "btn-disabled": props.state.saving, "btn-error": props.state.unsaved }}
          type="button"
          title="Save Note"
          onclick={() => triggerSave()}
        >
          {props.state.saving && <span class="loading loading-spinner text-warning"></span>}
          {!props.state.saving && <FiSave size={20} />}
        </button></li>
      </ul>
      <div ref={(el) => editorDiv = el}></div>
    </>
  )
}

export default Editor
