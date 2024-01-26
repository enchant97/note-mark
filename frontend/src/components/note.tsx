import { Accessor, Component, Match, Switch, createSignal, untrack } from "solid-js";
import NoteViewPlain from "./note/view_plain";
import NoteViewRendered from "./note/view_rendered";
import Icon from "./icon";
import { copyToClipboard } from "../core/helpers";
import { ToastType, useToast } from "../contexts/ToastProvider";
import { SetStoreFunction, Store } from "solid-js/store";
import Editor, { EditorState } from "./editor/editor";

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
            onclick={() => props.setMode(NoteMode.RENDERED)}
            class="tab"
            classList={{ "tab-active": props.mode === NoteMode.RENDERED }}
            title="switch to rendered view"
          >Rendered</button>
          <button
            onclick={() => props.setMode(NoteMode.PLAIN)}
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
      <Switch fallback={<NoteViewRendered content={props.content} />}>
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
