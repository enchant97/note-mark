import { Accessor, Component, Match, Show, Switch, createSignal } from "solid-js";
import { Note as NoteDetails } from "../core/types";
import NoteViewPlain from "./note/view_plain";
import NoteEdit from "./note/edit";
import NoteViewRendered from "./note/view_rendered";
import Icon from "./icon";

export enum NoteMode {
  RENDERED = "rendered",
  PLAIN = "plain",
  EDIT = "edit",
}

type NoteProps = {
  mode: NoteMode,
  setMode: (mode: NoteMode) => any,
  noteDetails: NoteDetails,
  content: Accessor<string | undefined>,
  setContent: (content: string) => any,
  isEditAllowed: boolean,
}

const Note: Component<NoteProps> = (props) => {
  const [isFullscreen, setIsFullscreen] = createSignal(false);

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
        <label class="tab swap inline-grid">
          <input
            type="checkbox"
            onchange={() => setIsFullscreen(!isFullscreen())}
            checked={isFullscreen()}
          />
          <div class="swap-on"><Icon name="minimize-2" size={18} /></div>
          <div class="swap-off"><Icon name="maximize-2" size={18} /></div>
        </label>
      </div>
      <Show when={props.content()}>
        {content => <Switch fallback={<NoteViewRendered content={content} />}>
          <Match when={props.mode === NoteMode.PLAIN}>
            <NoteViewPlain content={content} />
          </Match>
          <Match when={props.mode === NoteMode.EDIT}>
            <NoteEdit note={props.noteDetails} content={content} onChange={props.setContent} isFullscreen={isFullscreen} />
          </Match>
        </Switch>}
      </Show>
    </div>
  )
}

export default Note;
