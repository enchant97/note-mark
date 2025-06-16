import { EditorView, basicSetup } from "codemirror";
import { Compartment, EditorSelection, EditorState as InternalEditorState } from "@codemirror/state";
import { indentMore, indentLess } from "@codemirror/commands";
import { Accessor, Component, For, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { SetStoreFunction, Store } from "solid-js/store";
import Icon from "../icon";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands"
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { Vim, vim } from "@replit/codemirror-vim";
import { useModal } from "../../contexts/ModalProvider";
import CreateLinkModal from "./modals/create_link";
import CreateImageModal from "./modals/create_image";
import CreateTableModal from "./modals/create_table";
import StorageHandler from "../../core/storage";

const editorTheme = EditorView.baseTheme({
  "&.cm-editor": {
    "font-size": ".95rem",
  },
  ".cm-scroller": {
    "font-family": "var(--font-mono)",
  },
  ".cm-gutters": {
    "background-color": "var(--color-base-100)",
    "border-right": "var(--color-base-100)",
  },
  ".cm-activeLineGutter": {
    "background-color": "var(--color-base-200)",
  },
  ".ͼ5,.ͼc": {
    "color": "var(--color-info)",
  },
  ".ͼ7": {
    "text-decoration": "none",
  },
  ".cm-panels, .cm-panels-bottom": {
    borderTop: "none",
    backgroundColor: "var(--color-base-100)",
    color: "var(--color-base-content)",
  },
  ".cm-cursor": {
    "border-color": "var(--color-base-content)",
    "border-left-width": "2px",
  },
  ".cm-fat-cursor": {
    "color": "white !important",
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
  onContentChange?: (content: string) => any
}

const Editor: Component<EditorProps> = (props) => {
  let editorDiv: HTMLDivElement
  let editor: EditorView
  let toolbarElement: HTMLElement
  let autosaveTimeout: number;

  let vimCompartment = new Compartment()

  const { setModal, clearModal } = useModal()
  const [toolbarOffset, setToolbarOffset] = createSignal(0)
  const [toolbarVisible, setToolbarVisible] = createSignal(true)
  const [vimInputSetting, setvimInputSetting] = StorageHandler.createSettingSignal("editor_vim_mode_enabled", false)
  const [autoSaveSetting, setAutoSaveSetting] = StorageHandler.createSettingSignal("editor_autosave_enabled", false)

  const stickyToolbar = () => { return !toolbarVisible() && props.isFullscreen() }
  const vimInput = () => JSON.parse(vimInputSetting() || "false") as boolean
  const setVimInput = (v: unknown) => setvimInputSetting(JSON.stringify(v))
  const autoSave = () => JSON.parse((autoSaveSetting()) || "true") as boolean
  const setAutoSave = (v: unknown) => setAutoSaveSetting(JSON.stringify(v))

  const save = (state: InternalEditorState) => {
    props.onSave(state.doc.toString())
  }

  const onInput = (state: InternalEditorState) => {
    props.setState({ unsaved: true })
    if (props.onContentChange !== undefined) {
      props.onContentChange(state.doc.toString())
    }
    if (autoSave()) {
      window.clearTimeout(autosaveTimeout)
      autosaveTimeout = window.setTimeout(
        (state: InternalEditorState) => {
          if (autoSave()) {
            save(state)
          }
        },
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

  createEffect(() => {
    const enableVim = vimInput()
    if (editor) {
      if (enableVim) {
        let transaction = editor.state.update({ effects: vimCompartment.reconfigure(vim({ status: true })) })
        editor.update([transaction])
      } else {
        let transaction = editor.state.update({ effects: vimCompartment.reconfigure([]) })
        editor.update([transaction])
      }
    }
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
    clearTimeout(autosaveTimeout)
    props.setState({ unsaved: false })
  })

  onMount(() => {
    window.addEventListener("scroll", handleScroll)
    Vim.defineEx('write', 'w', triggerSave) // :w
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
            indentWithTab,
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
          // enable vim input mode based on the vimInput signal
          vimCompartment.of(vimInput() ? vim({ status: true }) : []),
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
        ref={(el) => toolbarElement = el}
        class="menu menu-horizontal flex-nowrap gap-6 p-2 w-full items-center overflow-x-auto overflow-y-clip shadow-glass backdrop-glass"
        classList={{
          "fixed": stickyToolbar(),
          "top-2": stickyToolbar(),
          "left-0": stickyToolbar(),
          "z-[1]": stickyToolbar(),
        }}
      >
        <ul class="menu-horizontal gap-2 flex-nowrap items-center">
          <li><label>
            <span class="cursor-pointer">Auto Save</span>
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
            class="btn btn-sm btn-square"
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
            class="btn btn-sm btn-square"
            title="Bold"
            onClick={() => wrapSelectionWith("**")}
          >
            <Icon name="bold" />
          </button></li>
          <li><button
            class="btn btn-sm btn-square"
            title="Italic"
            onClick={() => wrapSelectionWith("*")}
          >
            <Icon name="italic" />
          </button></li>
          <li><div class="dropdown dropdown-hover dropdown-bottom p-0">
            <div tabindex="0" role="button" class="btn btn-sm btn-square">
              <Icon name="hash" />
            </div>
            <ul tabindex="0" class="dropdown-content z-[1] menu menu-sm shadow-lg bg-base-300 rounded-box w-52">
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
        <ul class="menu-horizontal gap-2 flex-nowrap flex">
          <li><button
            class="btn btn-sm btn-square"
            title="Block Comment"
            onClick={() => addPrefixToLine("> ")}
          >
            <Icon name="chevron-right" />
          </button></li>
          <li><button
            class="btn btn-sm btn-square"
            title="De-Indent"
            onClick={() => {
              indentLess(editor)
              editor.focus()
            }}
          >
            <Icon name="chevrons-left" />
          </button></li>
          <li><button
            class="btn btn-sm btn-square"
            title="Indent"
            onClick={() => {
              indentMore(editor)
              editor.focus()
            }}
          >
            <Icon name="chevrons-right" />
          </button></li>
        </ul>
        <ul class="menu-horizontal gap-2 flex-nowrap flex">
          <li><button
            class="btn btn-sm btn-square"
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
            class="btn btn-sm btn-square"
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
            class="btn btn-sm btn-square"
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
        <ul class="menu-horizontal gap-2 flex-nowrap ml-auto items-center">
          <li><label>
            <span class="cursor-pointer">Vim</span>
            <input
              class="toggle toggle-sm"
              type="checkbox"
              checked={vimInput()}
              oninput={(ev) => {
                let v = ev.currentTarget.checked
                setVimInput(v)
              }}
            />
          </label></li>
          <li><a
            class="btn btn-sm btn-square"
            title="Open Help"
            href="https://github.github.com/gfm/"
            target="_blank"
          >
            <Icon name="help-circle" />
          </a></li>
        </ul>
      </menu>
      <div class="shadow-glass rounded-box p-2" ref={(el) => editorDiv = el}></div>
    </>
  )
}

export default Editor
