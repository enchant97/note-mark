import { Component, Show, createResource } from 'solid-js';
import { useApi } from '../../contexts/ApiProvider';
import { Note } from '../../core/types';
import { LoadingBar } from '../loading';
import { useToast, apiErrorIntoToast } from '../../contexts/ToastProvider';
import { ApiError } from '../../core/api';

type NoteViewPlainProps = {
  note: Note
}

const NoteViewPlain: Component<NoteViewPlainProps> = (props) => {
  const { api } = useApi()
  const { pushToast } = useToast()

  const [noteContent] = createResource(props.note, async (note) => {
    let result = await api().getNoteContentById(note.id)
    if (result instanceof ApiError) {
      pushToast(apiErrorIntoToast(result, "getting note content"))
      return
    } else return result
  })

  return (
    <Show when={noteContent() && !noteContent.loading} fallback={<LoadingBar />}>
      <div class="prose max-w-none"><pre class="whitespace-pre-wrap">{noteContent()}</pre></div>
    </Show>
  )
}

export default NoteViewPlain;
