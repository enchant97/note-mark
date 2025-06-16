import { Accessor, Component, Match, Switch, createSignal, onCleanup, onMount, untrack } from "solid-js";
import { SetStoreFunction, Store } from "solid-js/store";
import NoteViewPlain from "~/components/note/view_plain";
import NoteViewRendered from "~/components/note/view_rendered";
import Icon from "~/components/icon";
import { copyToClipboard } from "~/core/helpers";
import { ToastType, useToast } from "~/contexts/ToastProvider";
import Editor, { EditorState } from "~/components/editor/editor";
import { type Context } from "~/core/renderer";
import Split from "split.js";

const AUTO_SAVE_TIMEOUT = 2400;

export enum NoteMode {
  RENDERED = "rendered",
  PLAIN = "plain",
  EDIT = "edit",
  EDIT_SPLIT = "edit_split",
}

const EditorSplitScreen: Component<{ noteProps: NoteProps, isFullscreen: Accessor<boolean> }> = ({ noteProps, isFullscreen }) => {
  let editorElement: HTMLDivElement
  let renderedElement: HTMLDivElement
  let splitInstsance: Split.Instance

  let [currentContent, setCurrentContent] = createSignal(untrack(noteProps.content))

  onMount(() => {
    splitInstsance = Split([editorElement, renderedElement], {
      sizes: [66, 33],
      minSize: [300, 300],
    })
  })
  onCleanup(() => {
    splitInstsance?.destroy()
  })

  return (
    <div class="split">
      <div ref={(el) => editorElement = el} class="w-full max-h-[90vh] overflow-y-scroll">
        <Editor
          content={untrack(noteProps.content)}
          autoSaveTimeout={AUTO_SAVE_TIMEOUT}
          onSave={noteProps.onSave}
          state={noteProps.state}
          setState={noteProps.setState}
          isFullscreen={isFullscreen}
          onContentChange={setCurrentContent}
        />
      </div>
      <div ref={(el) => renderedElement = el} class="shadow-glass rounded-box p-2 w-full max-h-[90vh] overflow-y-scroll">
        <NoteViewRendered content={currentContent} context={noteProps.context} />
      </div>
    </div>
  )
}

type NoteProps = {
  mode: NoteMode,
  setMode: (mode: NoteMode) => any,
  content: Accessor<string>,
  setContent: (content: string) => any,
  context: Accessor<Context>,
  isEditAllowed: boolean,
  state: Store<EditorState>
  setState: SetStoreFunction<EditorState>
  onSave: (content: string) => any
}

const Note: Component<NoteProps> = (props) => {
  const { pushToast } = useToast()
  const [isFullscreen, setIsFullscreen] = createSignal(false);

  const copyContentsToClipboard = async () => {
    try {
      await copyToClipboard(props.content() || "")
      pushToast({ message: "copied to clipboard", type: ToastType.SUCCESS })
    } catch (err) {
      pushToast({ message: err.message, type: ToastType.ERROR })
    }
  }

  const query_navigation_allowed = () => {
    return (
      !props.state.unsaved ||
      props.state.unsaved && confirm("Note not saved, are you sure?")
    )
  }

  return (
    <div
      class="flex flex-col gap-4 bg-base-100"
      classList={{
        "full-screen": isFullscreen(),
        "p-4": isFullscreen(),
        "min-h-screen": isFullscreen(),
      }}
    >
      <div class="flex justify-between shadow-glass rounded-box p-1.5">
        <div class="tabs">
          <button
            onclick={() => {
              if (query_navigation_allowed()) {
                props.setMode(NoteMode.RENDERED)
              }
            }}
            class="tab"
            classList={{ "tab-active": props.mode === NoteMode.RENDERED }}
            title="switch to rendered view"
          ><Icon name="file-text" /></button>
          <button
            onclick={() => {
              if (query_navigation_allowed()) {
                props.setMode(NoteMode.PLAIN)
              }
            }}
            class="tab"
            classList={{ "tab-active": props.mode === NoteMode.PLAIN }}
            title="switch to plain view"
          ><Icon name="code" /></button>
          <button
            onclick={() => props.setMode(NoteMode.EDIT)}
            class="tab"
            disabled={!props.isEditAllowed}
            classList={{ "tab-active": props.mode === NoteMode.EDIT }}
            title="switch to editor"
          ><Icon name="edit-2" /></button>
          <button
            onclick={() => props.setMode(NoteMode.EDIT_SPLIT)}
            class="tab"
            disabled={!props.isEditAllowed}
            classList={{
              "tab-active": props.mode === NoteMode.EDIT_SPLIT,
              "max-md:hidden": props.mode !== NoteMode.EDIT_SPLIT,
            }}
            title="switch to editor with preview"
          ><Icon name="edit-2" />+<Icon name="file-text" /></button>
        </div>
        <div class="join p-1">
          <button
            class="join-item btn btn-sm"
            type="button"
            title="Copy Note To Clipboard"
            classList={{ "hidden": !window.isSecureContext }}
            onClick={copyContentsToClipboard}
          ><Icon name="copy" />
          </button>
          <label class="join-item btn btn-sm swap">
            <input
              title="Toggle Note Full-Screen"
              name="noteFullscreenToggle"
              type="checkbox"
              onchange={() => setIsFullscreen(!isFullscreen())}
              checked={isFullscreen()}
            />
            <div class="swap-on"><Icon name="minimize-2" size={18} /></div>
            <div class="swap-off"><Icon name="maximize-2" size={18} /></div>
          </label>
        </div>
      </div>
      <Switch fallback={<NoteViewRendered content={props.content} context={props.context} />}>
        <Match when={props.mode === NoteMode.PLAIN}>
          <NoteViewPlain content={props.content} />
        </Match>
        <Match when={props.mode === NoteMode.EDIT}>
          <Editor
            content={untrack(props.content)}
            autoSaveTimeout={AUTO_SAVE_TIMEOUT}
            onSave={props.onSave}
            state={props.state}
            setState={props.setState}
            isFullscreen={isFullscreen}
          />
        </Match>
        <Match when={props.mode === NoteMode.EDIT_SPLIT}>
          <EditorSplitScreen noteProps={props} isFullscreen={isFullscreen} />
        </Match>
      </Switch>
    </div>
  )
}

export default Note;
