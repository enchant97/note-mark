import { Component, Show, createResource } from 'solid-js';
import { useApi } from '../contexts/ApiProvider';
import { A, useParams } from '@solidjs/router';
import { HiOutlineDocument, HiOutlineFolder, HiOutlineUser } from 'solid-icons/hi';

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
    <div class="p-4">
      <div class="p-2 mb-4 text-sm breadcrumbs rounded-md shadow-md bg-base-200">
        <ul>
          <li>
            <HiOutlineUser size={16} />
            <span class="ml-1">{params.username}</span>
          </li>
          <li>
            <HiOutlineFolder size={16} />
            <span class="ml-1">{params.bookSlug}</span>
          </li>
          <li>
            <HiOutlineDocument size={16} />
            <span class="ml-1">{params.noteSlug}</span>
          </li>
        </ul>
      </div>
      <Show when={noteContent()} fallback={<></>}>
        <div class="prose" innerHTML={noteContent()}></div>
      </Show>
    </div>
  );
};

export default Shelf;
