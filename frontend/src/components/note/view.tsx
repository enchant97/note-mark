import { Component, Show, createResource } from 'solid-js';
import { useApi } from '../../contexts/ApiProvider';
import { Note } from '../../core/types';
import { LoadingBar } from '../loading';
import { useToast, apiErrorIntoToast } from '../../contexts/ToastProvider';
import { ApiError } from '../../core/api';

type NoteViewProps = {
  note: Note
}

const NoteView: Component<NoteViewProps> = (props) => {
  const { api } = useApi()
  const { pushToast } = useToast()
  const [noteContent] = createResource(() => props.note, async (note) => {
    let result = await api().getNoteRenderedById(note.id)
    if (result instanceof ApiError) {
      pushToast(apiErrorIntoToast(result, "getting note content"))
      return
    } else return result
  })

  return (
    <Show when={noteContent()} fallback={<LoadingBar />}>
      {content => <div class="prose max-w-none" innerHTML={content()}></div>}
    </Show>
  )
}

export default NoteView;
