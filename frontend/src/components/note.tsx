import { Accessor, Component, Match, Switch, createSignal, untrack } from "solid-js";
import { SetStoreFunction, Store } from "solid-js/store";
import NoteViewPlain from "~/components/note/view_plain";
import NoteViewRendered from "~/components/note/view_rendered";
import Icon from "~/components/icon";
import { copyToClipboard } from "~/core/helpers";
import { ToastType, useToast } from "~/contexts/ToastProvider";
import Editor, { EditorState } from "~/components/editor/editor";
import { type Context } from "~/core/renderer";

const AUTO_SAVE_TIMEOUT = 2400;

export enum NoteMode {
  RENDERED = "rendered",
  PLAIN = "plain",
  EDIT = "edit",
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
      <div class="bg-base-200 shadow-md rounded-md flex justify-between">
        <div class="tabs tabs-boxed">
          <button
            onclick={() => {
              if (query_navigation_allowed()) {
                props.setMode(NoteMode.RENDERED)
              }
            }}
            class="tab"
            classList={{ "tab-active": props.mode === NoteMode.RENDERED }}
            title="switch to rendered view"
          >Rendered</button>
          <button
            onclick={() => {
              if (query_navigation_allowed()) {
                props.setMode(NoteMode.PLAIN)
              }
            }}
            class="tab"
            classList={{ "tab-active": props.mode === NoteMode.PLAIN }}
            title="switch to plain view"
          >Plain</button>
          <button
            onclick={() => props.setMode(NoteMode.EDIT)}
            class="tab"
            disabled={!props.isEditAllowed}
            classList={{ "tab-active": props.mode === NoteMode.EDIT }}
            title="switch to editor"
          >Editor</button>
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
      </Switch>
    </div>
  )
}

export default Note;
