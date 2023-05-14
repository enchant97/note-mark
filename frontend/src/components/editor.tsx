import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { Component, createEffect, onMount } from "solid-js";

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

type EditorProps = {
  content: string
  oninput: (state: EditorState) => void
}

const Editor: Component<EditorProps> = (props) => {
  let editorDiv: HTMLDivElement
  let editor: EditorView

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
      state: EditorState.create({
        extensions: [
          basicSetup,
          EditorView.lineWrapping,
          editorTheme,
          EditorView.updateListener.of((v) => {
            if (v.docChanged) {
              props.oninput(v.state)
            }
          }),
        ],
        doc: props.content,
      }),
      parent: editorDiv,
    })
  })

  return <div ref={editorDiv}></div>
}

export default Editor
