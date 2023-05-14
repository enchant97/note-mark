import { Component, createResource } from 'solid-js';
import { useApi } from '../../contexts/ApiProvider';
import { Note } from '../../core/types';

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
    <div class="prose" innerHTML={noteContent()}></div>
  )
}

export default NoteView;
