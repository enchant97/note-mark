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
    <div class="flex flex-col gap-4 px-6">
      <NoteBreadcrumb {...breadcrumb()} />
      <Show when={note()} fallback={
        <div class="hero pt-6 bg-base-200 rounded-md">
          <div class="hero-content text-center">
            <div class="max-w-md">
              <h1 class="text-5xl font-bold">No Note Selected</h1>
              <p class="py-6">Either create a new note or select an existing one.</p>
            </div>
          </div>
        </div>
      }>
        <NoteView note={note()} />
      </Show>
    </div>
  );
};

export default Shelf;
