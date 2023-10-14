import { Accessor, Component, Match, Show, Switch } from "solid-js";
import { Note as NoteDetails } from "../core/types";
import NoteViewPlain from "./note/view_plain";
import NoteEdit from "./note/edit";
import NoteViewRendered from "./note/view_rendered";

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
  return (
    <>
      <div class="bg-base-200 shadow-md rounded-md">
        <div class="tabs justify-center">
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
      </div>
      <Show when={props.content()}>
        {content => <Switch fallback={<NoteViewRendered content={content} />}>
          <Match when={props.mode === NoteMode.PLAIN}>
            <NoteViewPlain content={content} />
          </Match>
          <Match when={props.mode === NoteMode.EDIT}>
            <NoteEdit note={props.noteDetails} content={content} onChange={props.setContent} />
          </Match>
        </Switch>}
      </Show>
    </>
  )
}

export default Note;
