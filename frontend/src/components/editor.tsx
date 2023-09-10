import { EditorView, basicSetup } from "codemirror";
import { EditorState as InternalEditorState } from "@codemirror/state";
import { Component, createEffect, createSignal, onMount } from "solid-js";
import { SetStoreFunction, Store } from "solid-js/store";
import Icon from "./icon";
import { keymap } from "@codemirror/view";

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

  const [autoSave, setAutoSave] = createSignal(true)

  const save = (state: InternalEditorState) => {
    props.onSave(state.doc.toString())
  }

  const onInput = (state: InternalEditorState) => {
    props.setState({ unsaved: true })
    if (autoSave()) {
      window.clearTimeout(autosaveTimeout)
      autosaveTimeout = window.setTimeout(
        save,
        props.autoSaveTimeout,
        state,
      )
    }
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
          keymap.of([{
            key: "Mod-s", run: () => {
              if (!props.state.saving)
                triggerSave()
              return true
            }
          }]),
        ],
        doc: props.content,
      }),
      parent: editorDiv,
    })
    editor.contentDOM.setAttribute("spellcheck", "true")
    editor.focus()
  })

  return (
    <>
      <menu class="menu menu-sm menu-horizontal gap-2 bg-base-200 rounded-md shadow-md p-2 w-full items-center">
        <li><label class="form-control">
          <span class="label-text cursor-pointer">Auto Save</span>
          <input
            class="toggle toggle-sm"
            type="checkbox"
            checked={autoSave()}
            oninput={(ev) => {
              let v = ev.currentTarget.checked
              if (v && props.state.unsaved) { triggerSave() }
              setAutoSave(v)
            }}
          />
        </label></li>
        <li><button
          class="btn btn-sm btn-square btn-outline"
          disabled={props.state.saving}
          classList={{ "btn-error": props.state.unsaved }}
          type="button"
          title="Save Note"
          onclick={() => triggerSave()}
        >
          {props.state.saving && <span class="loading loading-spinner text-warning"></span>}
          {!props.state.saving && <Icon name="save" />}
        </button></li>
      </menu>
      <div ref={(el) => editorDiv = el}></div>
    </>
  )
}

export default Editor
