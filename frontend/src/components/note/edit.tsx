import { Component, Show, createResource } from 'solid-js';
import { useApi } from '../../contexts/ApiProvider';
import { Note } from '../../core/types';
import Editor, { EditorState } from '../editor';
import { createStore } from 'solid-js/store';
import { LoadingBar } from '../loading';
import { resultUnwrap } from '../../core/core';

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
    return resultUnwrap(result)
  })

  const save = async (content: string) => {
    setState({ saving: true })
    let result = await api().updateNoteContent(props.note.id, content)
    setState({ saving: false })
    // TODO handle this error
    resultUnwrap(result)
    setState({ unsaved: false })
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
