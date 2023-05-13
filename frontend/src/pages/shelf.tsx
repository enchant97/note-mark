import { Component, Show, createResource } from 'solid-js';
import { useApi } from '../contexts/ApiProvider';
import { useParams } from '@solidjs/router';

const Shelf: Component = () => {
  const params = useParams()
  const { api } = useApi()

  const [note] = createResource(() => [params.username, params.bookSlug, params.noteSlug], async ([username, bookSlug, noteSlug]) => {
    if (!username || !bookSlug || !noteSlug) return undefined
    let result = await api().getNoteBySlug(username, bookSlug, noteSlug)
    // TODO handle errors
    return result.unwrap()
  })

  const [noteContent] = createResource(note, async (note) => {
    if (!note) return undefined
    let result = await api().getNoteRenderedById(note.id)
    // TODO handle errors
    return result.unwrap()
  })

  return (
    <Show when={noteContent()} fallback={<></>}>
      <div class="prose p-4" innerHTML={noteContent()}></div>
    </Show>
  );
};

export default Shelf;
