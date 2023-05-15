import { Component, Show, createResource } from 'solid-js';
import { useApi } from '../../contexts/ApiProvider';
import { Note } from '../../core/types';
import Editor, { EditorState } from '../editor';
import { createStore } from 'solid-js/store';

type NoteEditProps = {
  note: Note
}

const NoteEdit: Component<NoteEditProps> = (props) => {
  const { api } = useApi()

  const [state, setState] = createStore<EditorState>({
    saving: false,
    unsaved: false,
  })

  const [initialContent] = createResource(() => props.note, async (note) => {
    let result = await api().getNoteContentById(note.id)
    // TODO handle errors
    return result.unwrap()
  })

  const save = async (content: string) => {
    setState({ saving: true })
    let result = await api().updateNoteContent(props.note.id, content)
    setState({ saving: false })
    // TODO handle this error
    result.unwrap()
    setState({ unsaved: false })
  }

  return (
    <Show when={initialContent() !== undefined}>
      <Editor
        content={initialContent() || ""}
        autoSaveTimeout={6000}
        onSave={save}
        state={state}
        setState={setState}
      />
    </Show>
  )
}

export default NoteEdit;
