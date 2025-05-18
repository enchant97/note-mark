import { Component, For, Suspense, createResource, createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useNavigate } from '@solidjs/router';
import BaseModal from '~/components/modals/base';
import { Book, bookIntoUpdateBook, Note, User } from '~/core/types';
import { toSlug } from "~/core/helpers";
import { useApi } from '~/contexts/ApiProvider';
import { apiErrorIntoToast, useToast } from '~/contexts/ToastProvider';
import { ApiError } from '~/core/api';
import Icon from '~/components/icon';
import { LoadingSpin } from '~/components/loading';

type DeletedNotesProps = {
  bookId: string
  restoreNote: (note: Note) => void
}

const DeletedNotes: Component<DeletedNotesProps> = (props) => {
  const { api } = useApi()
  const { pushToast } = useToast()
  const [notes, { mutate }] = createResource(props.bookId, async (bookId) => {
    let result = await api().getNotesByBookId(bookId, true)
    if (result instanceof ApiError) {
      pushToast(apiErrorIntoToast(result, "getting removed notes"))
      return []
    }
    return result
  })

  const deleteNote = async (noteId: string, i: number) => {
    let result = await api().deleteNote(noteId, true)
    if (result instanceof ApiError) pushToast(apiErrorIntoToast(result, "deleting note"))
    else {
      let new_notes = notes()
      if (new_notes) {
        new_notes?.splice(i, 1)
        mutate([...new_notes])
      }
    }
  }
  const restoreNote = async (noteId: string, i: number) => {
    let result = await api().restoreNoteById(noteId)
    if (result instanceof ApiError) pushToast(apiErrorIntoToast(result, "restoring note"))
    else {
      let new_notes = notes()
      if (new_notes) {
        props.restoreNote(new_notes[i])
        new_notes?.splice(i, 1)
        mutate([...new_notes])
      }
    }
  }

  return (
    <div>
      <h4 class="text-bold mb-2">Removed Notes</h4>
      <ul class="max-h-40 h-40 overflow-y-auto bg-base-200">
        <Suspense fallback={<LoadingSpin />}>
          <For each={notes()}>
            {(note, i) =>
              <li class="flex items-center p-2 gap-2 rounded">
                <span class="mr-auto">{note.name}</span>
                <div class="join">
                  <button
                    onclick={() => restoreNote(note.id, i())}
                    type="button"
                    class="join-item btn btn-outline btn-sm"
                  >Restore</button>
                  <button
                    onclick={() => deleteNote(note.id, i())}
                    type="button"
                    class="join-item btn btn-outline btn-sm btn-error"
                  ><Icon name="trash" /></button>
                </div>
              </li>
            }
          </For>
        </Suspense>
      </ul>
    </div>
  )
}

type UpdateBookModalProps = {
  onClose: (book?: Book) => void
  onDeleteClose: (bookId: string) => void
  user: User
  book: Book
  restoreNote: (note: Note) => void
}

const UpdateBookModal: Component<UpdateBookModalProps> = (props) => {
  const { api } = useApi()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = createStore(bookIntoUpdateBook(props.book))
  const [loading, setLoading] = createSignal(false)

  const onSubmit = async (ev: Event) => {
    ev.preventDefault()
    setLoading(true)
    let result = await api().updateBook(props.book.id, form)
    setLoading(false)
    if (result instanceof ApiError) pushToast(apiErrorIntoToast(result, "saving book"))
    else {
      navigate(`/${props.user.username}/${form.slug}`)
      props.onClose({
        ...props.book,
        name: form.name || props.book.name,
        slug: form.slug || props.book.slug,
        isPublic: form.isPublic || props.book.isPublic
      })
    }
  }

  const onDelete = async () => {
    setLoading(true)
    let result = await api().deleteBook(props.book.id)
    setLoading(false)
    if (result instanceof ApiError) pushToast(apiErrorIntoToast(result, "deleting book"))
    else {
      navigate(`/${props.user.username}`)
      props.onDeleteClose(props.book.id)
    }
  }

  return (
    <BaseModal title="Update Book">
      <form onsubmit={onSubmit}>
        <label class="form-control">
          <span class="label"><span class="label-text">Title</span></span>
          <input
            oninput={(ev) => setForm({
              name: ev.currentTarget.value,
            })}
            value={form.name}
            class="input input-bordered w-full"
            type="text"
            placeholder="e.g. My Amazing Book"
            required
          />
        </label>
        <label class="form-control">
          <span class="label"><span class="label-text">Slug</span></span>
          <input
            oninput={(ev) => setForm({
              slug: toSlug(ev.currentTarget.value)
            })}
            value={form.slug}
            class="input input-bordered input-sm w-full"
            type="text"
            placeholder="e.g. my-amazing-book"
            pattern="(?:[a-z0-9]|-)+"
            required
          />
        </label>
        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text">Public</span>
            <input
              onchange={() => setForm({ isPublic: !form.isPublic })}
              checked={form.isPublic}
              class="checkbox"
              type="checkbox"
            />
          </label>
        </div>
        <DeletedNotes bookId={props.book.id} restoreNote={props.restoreNote} />
        <div class="modal-action">
          <button onclick={onDelete} class="btn btn-outline btn-error" disabled={loading()} type="button">
            <Icon name="trash" />
            Delete
          </button>
          <button class="btn btn-primary" disabled={loading()} classList={{ loading: loading() }} type="submit">
            <Icon name="save" />
            Save
          </button>
          <button onclick={() => props.onClose()} class="btn" type="button">Cancel</button>
        </div>
      </form>
    </BaseModal>
  );
};

export default UpdateBookModal;
