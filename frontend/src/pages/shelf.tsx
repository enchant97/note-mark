import { Component, Show, createResource } from 'solid-js';
import { useApi } from '../contexts/ApiProvider';
import { useParams } from '@solidjs/router';
import NoteView from '../components/note/view';
import { Breadcrumb } from '../core/types';
import NoteBreadcrumb from '../components/note/breadcrumb';

const Shelf: Component = () => {
  const params = useParams()
  const { api } = useApi()

  const breadcrumb: () => Breadcrumb = () => {
    return {
      username: params.username,
      bookSlug: params.bookSlug,
      noteSlug: params.noteSlug,
    }
  }

  const [note] = createResource(breadcrumb, async ({ username, bookSlug, noteSlug }) => {
    if (!username || !bookSlug || !noteSlug) return undefined
    let result = await api().getNoteBySlug(username, bookSlug, noteSlug)
    // TODO handle errors
    return result.unwrap()
  })

  return (
    <div class="p-4">
      <NoteBreadcrumb {...breadcrumb()} />
      <Show when={note()} fallback={<></>}>
        <NoteView note={note()} />
      </Show>
    </div>
  );
};

export default Shelf;
