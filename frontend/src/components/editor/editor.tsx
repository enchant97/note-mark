
import { EditorView, basicSetup } from "codemirror";
import { EditorSelection, EditorState as InternalEditorState } from "@codemirror/state";
import { indentMore, indentLess } from "@codemirror/commands";
import { Accessor, Component, For, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { SetStoreFunction, Store } from "solid-js/store";
import Icon from "../icon";
import { keymap } from "@codemirror/view";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { useModal } from "../../contexts/ModalProvider";
import CreateLinkModal from "./modals/create_link";
import CreateImageModal from "./modals/create_image";
import CreateTableModal from "./modals/create_table";

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
  },
  ".ͼ5,.ͼc": {
    "color": "oklch(var(--in))",
  },
  ".ͼ7": {
    "text-decoration": "none",
  },
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
  isFullscreen: Accessor<boolean>
}

const Editor: Component<EditorProps> = (props) => {
  let editorDiv: HTMLDivElement
  let editor: EditorView
  let toolbarElement: HTMLElement
  let autosaveTimeout: number;

  const { setModal, clearModal } = useModal()
  const [toolbarOffset, setToolbarOffset] = createSignal(0)
  const [toolbarVisible, setToolbarVisible] = createSignal(true)
  const [autoSave, setAutoSave] = createSignal(true)

  const stickyToolbar = () => { return !toolbarVisible() && props.isFullscreen() }

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

  const wrapSelectionWith = (content: string) => {
    let state = editor.state
    let tx = state.update(state.changeByRange(range => {
      let currentContent = state.sliceDoc(range.from, range.to)
      let newContent = `${content}${currentContent}${content}`
      return {
        changes: { from: range.from, to: range.to, insert: newContent },
        range: EditorSelection.range(range.from, range.from + newContent.length)
      }
    }))
    editor.dispatch(tx)
    editor.focus()
  }

  const addPrefixToLine = (prefix: string) => {
    let state = editor.state
    let tx = state.update(state.changeByRange(range => {
      let line = state.doc.lineAt(range.from)
      return {
        changes: { from: line.from, to: line.from, insert: prefix },
        range: EditorSelection.range(line.from, line.from + prefix.length)
      }
    }))
    editor.dispatch(tx)
    editor.focus()
  }

  const replaceSelection = (replacement: string) => {
    let state = editor.state
    let tx = state.update(state.changeByRange(range => {
      return {
        changes: { from: range.from, to: range.to, insert: replacement },
        range: EditorSelection.range(range.from, range.from + replacement.length)
      }
    }))
    editor.dispatch(tx)
    editor.focus()
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

  createEffect(() => {
    props.isFullscreen()
    if (toolbarElement)
      setToolbarOffset(toolbarElement.offsetTop)
  })

  const handleScroll = () => {
    if (window.scrollY >= toolbarOffset()) {
      setToolbarVisible(false)
    } else {
      setToolbarVisible(true)
    }
  }

  onCleanup(() => {
    window.removeEventListener("scroll", handleScroll)
  })

  onMount(() => {
    window.addEventListener("scroll", handleScroll)
    editor = new EditorView({
      state: InternalEditorState.create({
        extensions: [
          basicSetup,
          markdown({
            base: markdownLanguage,
          }),
          EditorView.lineWrapping,
          editorTheme,
          EditorView.updateListener.of((v) => {
            if (v.docChanged) {
              onInput(v.state)
            }
          }),
          keymap.of([
            {
              key: "Mod-s", run: () => {
                if (!props.state.saving)
                  triggerSave()
                return true
              }
            },
            {
              key: "Mod-b", run: () => {
                wrapSelectionWith("**")
                return true
              }
            },
            {
              key: "Mod-i", run: () => {
                wrapSelectionWith("*")
                return true
              }
            },
          ]),
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
      <menu
        ref={toolbarElement}
        class="menu menu-sm menu-horizontal flex-nowrap gap-6 bg-base-200 rounded-md shadow-md p-2 w-full items-center"
        classList={{
          "fixed": stickyToolbar(),
          "top-0": stickyToolbar(),
          "left-0": stickyToolbar(),
          "z-[1]": stickyToolbar(),
        }}
      >
        <ul class="menu-horizontal gap-2 flex-nowrap">
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
            title="Save"
            onclick={() => triggerSave()}
          >
            {props.state.saving && <span class="loading loading-spinner text-warning"></span>}
            {!props.state.saving && <Icon name="save" />}
          </button></li>
        </ul>
        <ul class="menu-horizontal gap-2 flex-nowrap">
          <li><button
            class="btn btn-sm btn-square btn-outline"
            title="Bold"
            onClick={() => wrapSelectionWith("**")}
          >
            <Icon name="bold" />
          </button></li>
          <li><button
            class="btn btn-sm btn-square btn-outline"
            title="Italic"
            onClick={() => wrapSelectionWith("*")}
          >
            <Icon name="italic" />
          </button></li>
          <li><div class="dropdown dropdown-hover dropdown-bottom p-0">
            <div tabindex="0" role="button" class="btn btn-sm btn-square btn-outline">
              <Icon name="hash" />
            </div>
            <ul tabindex="0" class="dropdown-content z-[1] menu shadow-lg bg-base-300 rounded-box w-52">
              <For each={[1, 2, 3, 4, 5, 6]}>
                {(level) => (
                  <li><button
                    onClick={() => addPrefixToLine("#".repeat(level) + " ")}
                  >
                    H.{level}
                  </button></li>
                )}
              </For>
            </ul>
          </div></li>
        </ul>
        <ul class="menu-horizontal gap-2 flex-nowrap hidden sm:flex">
          <li><button
            class="btn btn-sm btn-square btn-outline"
            title="Block Comment"
            onClick={() => addPrefixToLine("> ")}
          >
            <Icon name="chevron-right" />
          </button></li>
          <li><button
            class="btn btn-sm btn-square btn-outline"
            title="De-Indent"
            onClick={() => {
              indentLess(editor)
              editor.focus()
            }}
          >
            <Icon name="chevrons-left" />
          </button></li>
          <li><button
            class="btn btn-sm btn-square btn-outline"
            title="Indent"
            onClick={() => {
              indentMore(editor)
              editor.focus()
            }}
          >
            <Icon name="chevrons-right" />
          </button></li>
        </ul>
        <ul class="menu-horizontal gap-2 flex-nowrap hidden md:flex">
          <li><button
            class="btn btn-sm btn-square btn-outline"
            title="Insert Link"
            onClick={() => setModal({
              component: CreateLinkModal,
              props: {
                onClose: (content?: string) => {
                  if (content) {
                    replaceSelection(content)
                  }
                  clearModal()
                  editor.focus()
                }
              }
            })}
          >
            <Icon name="link" />
          </button></li>
          <li><button
            class="btn btn-sm btn-square btn-outline"
            title="Insert Image"
            onClick={() => setModal({
              component: CreateImageModal,
              props: {
                onClose: (content?: string) => {
                  if (content) {
                    replaceSelection(content)
                  }
                  clearModal()
                  editor.focus()
                }
              }
            })}
          >
            <Icon name="image" />
          </button></li>
          <li><button
            class="btn btn-sm btn-square btn-outline"
            title="Insert Table"
            onClick={() => setModal({
              component: CreateTableModal,
              props: {
                onClose: (content?: string) => {
                  if (content) {
                    replaceSelection(content)
                  }
                  clearModal()
                  editor.focus()
                }
              }
            })}
          >
            <Icon name="table" />
          </button></li>
        </ul>
        <ul class="menu-horizontal gap-2 flex-nowrap ml-auto">
          <li><a
            class="btn btn-sm btn-square btn-outline"
            title="Open Help"
            href="https://github.github.com/gfm/"
            target="_blank"
          >
            <Icon name="help-circle" />
          </a></li>
        </ul>
      </menu>
      <div ref={(el) => editorDiv = el}></div>
    </>
  )
}

export default Editor
