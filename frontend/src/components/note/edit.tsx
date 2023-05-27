import { Component, Show, createResource } from 'solid-js';
import { useApi } from '../../contexts/ApiProvider';
import { Note } from '../../core/types';
import Editor, { EditorState } from '../editor';
import { createStore } from 'solid-js/store';
import { LoadingBar } from '../loading';
import { apiErrorIntoToast, useToast } from '../../contexts/ToastProvider';
import { ApiError } from '../../core/api';

type NoteEditProps = {
  note: Note
}

const NoteEdit: Component<NoteEditProps> = (props) => {
  const { api } = useApi()
  const { pushToast } = useToast()

  const [state, setState] = createStore<EditorState>({
    saving: false,
    unsaved: false,
  })

  const [initialContent] = createResource(() => props.note, async (note) => {
    let result = await api().getNoteContentById(note.id)
    if (result instanceof ApiError) {
      pushToast(apiErrorIntoToast(result, "getting note content"))
      return
    } else return result
  })

  const save = async (content: string) => {
    setState({ saving: true })
    let result = await api().updateNoteContent(props.note.id, content)
    setState({ saving: false })
    if (result instanceof ApiError) pushToast(apiErrorIntoToast(result, "saving note"))
    else setState({ unsaved: false })
  }

  return (
    <Show when={initialContent()} fallback={<LoadingBar />} keyed>
      {content => <Editor
        content={content}
        autoSaveTimeout={6000}
        onSave={save}
        state={state}
        setState={setState}
      />}
    </Show>
  )
}

export default NoteEdit;
