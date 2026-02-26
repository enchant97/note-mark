import { Accessor, Component, Match, Setter, Show, Switch, createSignal, onCleanup, onMount, untrack } from "solid-js";
import NoteViewPlain from "~/components/note/ViewPlain";
import NoteViewRendered from "~/components/note/ViewRendered";
import NoteViewEmpty from "~/components/note/ViewEmpty";
import Icon from "~/components/Icon";
import { copyToClipboard } from "~/core/helpers";
import { ToastType, useToast } from "~/contexts/ToastProvider";
import Editor from "~/components/editor/Editor";
import Split from "split.js";
import { NoteEngineReadOnly } from "~/core/note-engine";

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
          content={untrack(noteProps.noteEngine.content)}
          autoSaveTimeout={AUTO_SAVE_TIMEOUT}
          onSave={noteProps.onSave}
          saved={noteProps.saved}
          setSaved={noteProps.setSaved}
          saving={noteProps.saving}
          isFullscreen={isFullscreen}
        />
      </div>
      <div ref={(el) => renderedElement = el} class="shadow-glass rounded-box p-2 w-full max-h-[90vh] overflow-y-scroll">
        <NoteViewRendered noteEngine={noteProps.noteEngine} />
      </div>
    </div>
  )
}

type NoteProps = {
  noteEngine: NoteEngineReadOnly,
  mode: NoteMode,
  setMode: (mode: NoteMode) => any,
  isEditAllowed: boolean,
  onSave: (content: string) => any
  saved: Accessor<boolean>
  setSaved: Setter<boolean>
  saving: () => boolean
}

export default function Note(props: NoteProps) {
  const { pushToast } = useToast()
  const [isFullscreen, setIsFullscreen] = createSignal(false);

  const copyContentsToClipboard = async () => {
    try {
      await copyToClipboard(props.noteEngine.content() || "")
      pushToast({ message: "copied to clipboard", type: ToastType.SUCCESS })
    } catch (err) {
      pushToast({ message: err.message, type: ToastType.ERROR })
    }
  }

  const query_navigation_allowed = () => {
    return (
      props.saved ||
      !props.saved && confirm("Note not saved, are you sure?")
    )
  }

  return (
    <div
      class="flex flex-col gap-2 bg-base-100"
      classList={{
        "full-screen": isFullscreen(),
        "p-4": isFullscreen(),
        "min-h-screen": isFullscreen(),
      }}
    >
      <div class="flex justify-between shadow-glass rounded-box p-1.5">
        <div role="tablist" class="tabs tabs-box bg-base-100">
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
            class="join-item btn"
            type="button"
            title="Copy Note To Clipboard"
            classList={{ "hidden": !window.isSecureContext }}
            onClick={copyContentsToClipboard}
          ><Icon name="copy" />
          </button>
          <label class="join-item btn swap">
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
      <Switch fallback={
        <Show when={props.noteEngine.content().replace("\n", "").length !== 0} fallback={<NoteViewEmpty />}>
          <NoteViewRendered noteEngine={props.noteEngine} />
        </Show>
      }>
        <Match when={props.mode === NoteMode.PLAIN}>
          <Show when={props.noteEngine.content().replace("\n", "").length !== 0} fallback={<NoteViewEmpty />}>
            <NoteViewPlain content={props.noteEngine.content} />
          </Show>
        </Match>
        <Match when={props.mode === NoteMode.EDIT}>
          <Editor
            content={untrack(props.noteEngine.content)}
            autoSaveTimeout={AUTO_SAVE_TIMEOUT}
            onSave={props.onSave}
            saved={props.saved}
            setSaved={props.setSaved}
            saving={props.saving}
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
