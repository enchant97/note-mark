import { Accessor, Component, untrack } from 'solid-js';
import { useApi } from '../../contexts/ApiProvider';
import { Note } from '../../core/types';
import Editor, { EditorState } from '../editor/editor';
import { createStore } from 'solid-js/store';
import { apiErrorIntoToast, useToast } from '../../contexts/ToastProvider';
import { ApiError } from '../../core/api';

const AUTO_SAVE_TIMEOUT = 2400;

type NoteEditProps = {
  note: Note
  content: Accessor<string>
  onChange: (newContent: string) => any
}

const NoteEdit: Component<NoteEditProps> = (props) => {
  const { api } = useApi()
  const { pushToast } = useToast()

  const [state, setState] = createStore<EditorState>({
    saving: false,
    unsaved: false,
  })

  const save = async (content: string) => {
    setState({ saving: true })
    let result = await api().updateNoteContent(props.note.id, content)
    setState({ saving: false })
    if (result instanceof ApiError) pushToast(apiErrorIntoToast(result, "saving note"))
    else {
      setState({ unsaved: false })
      props.onChange(content)
    }
  }

  return (
    <Editor
      content={untrack(props.content)}
      autoSaveTimeout={AUTO_SAVE_TIMEOUT}
      onSave={save}
      state={state}
      setState={setState}
    />
  )
}

export default NoteEdit;
