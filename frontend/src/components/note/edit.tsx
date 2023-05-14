import { Component, Show, createResource, createSignal } from 'solid-js';
import { useApi } from '../../contexts/ApiProvider';
import { Note } from '../../core/types';
import { EditorState } from "@codemirror/state";
import Editor from '../editor';

type NoteEditProps = {
  note: Note
}

const NoteEdit: Component<NoteEditProps> = (props) => {
  const { api } = useApi()
  const [unsaved, setUnsaved] = createSignal(false)

  const [initialContent] = createResource(() => props.note, async (note) => {
    let result = await api().getNoteContentById(note.id)
    // TODO handle errors
    return result.unwrap()
  })

  let save_timeout: number;

  const save_doc = async (state: EditorState) => {
    let content = state.doc.toString()
    let result = await api().updateNoteContent(props.note.id, content)
    // TODO handle this error
    result.unwrap()
    setUnsaved(false)
  }

  let on_doc_input = (state: EditorState) => {
    setUnsaved(true)
    window.clearTimeout(save_timeout)
    save_timeout = window.setTimeout(save_doc, 8000, state)
  }

  return (
    <>
      <div>
        {unsaved() && "UNSAVED!" || "SAVED"}
      </div>
      <Show when={initialContent() !== undefined}>
        <Editor content={initialContent()} oninput={on_doc_input} />
      </Show>
    </>
  )
}

export default NoteEdit;
