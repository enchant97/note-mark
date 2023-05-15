import { Component, Show, Suspense, createResource, lazy } from 'solid-js';
import { useApi } from '../contexts/ApiProvider';
import { useParams, useSearchParams } from '@solidjs/router';
import { Breadcrumb } from '../core/types';
import NoteBreadcrumb from '../components/note/breadcrumb';

const NoteEdit = lazy(() => import("../components/note/edit"))
const NoteView = lazy(() => import("../components/note/view"))

const Shelf: Component = () => {
  const params = useParams()
  const { api } = useApi()
  const [searchParams, setSearchParams] = useSearchParams()

  const breadcrumb: () => Breadcrumb = () => {
    return {
      username: params.username,
      bookSlug: params.bookSlug,
      noteSlug: params.noteSlug,
    }
  }

  const editMode = () => {
    return searchParams.edit !== undefined && searchParams.edit !== "false"
  }

  const [note] = createResource(breadcrumb, async ({ username, bookSlug, noteSlug }) => {
    if (!username || !bookSlug || !noteSlug) return undefined
    let result = await api().getNoteBySlug(username, bookSlug, noteSlug)
    // TODO handle errors
    return result.unwrap()
  })

  return (
    <div class="flex flex-col gap-4">
      <div class="flex gap-4">
        <NoteBreadcrumb class="flex-1" {...breadcrumb()} />
        <Show when={note()}>
          <label class="label cursor-pointer gap-3 p-2 rounded-md shadow-md bg-base-200">
            <span class="label-text">Edit</span>
            <input type="checkbox" class="toggle" checked={editMode()} onchange={(_) => {
              if (editMode()) { setSearchParams({ edit: undefined }) }
              else { setSearchParams({ edit: "true" }) }
            }} />
          </label>
        </Show>
      </div>
      <Show when={!note.loading} fallback={<progress class="progress w-full"></progress>}>
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
          {editMode() && <NoteEdit note={note()} /> || <NoteView note={note()} />}
        </Show>
      </Show>
    </div>
  );
};

export default Shelf;
