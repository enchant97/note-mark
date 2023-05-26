import { Component, Show, createResource } from 'solid-js';
import { useApi } from '../../contexts/ApiProvider';
import { Note } from '../../core/types';
import { LoadingBar } from '../loading';

type NoteViewProps = {
  note: Note
}

const NoteView: Component<NoteViewProps> = (props) => {
  const { api } = useApi()

  const [noteContent] = createResource(() => props.note, async (note) => {
    let result = await api().getNoteRenderedById(note.id)
    // TODO handle errors
    return result.unwrap()
  })

  return (
    <Show when={noteContent()} fallback={<LoadingBar />}>
      {content => <div class="prose max-w-none" innerHTML={content()}></div>}
    </Show>
  )
}

export default NoteView;
