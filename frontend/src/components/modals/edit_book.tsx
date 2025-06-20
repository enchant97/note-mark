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
      <div class="overflow-y-auto max-h-40">
        <ul class="list gap-2">
          <Suspense fallback={<LoadingSpin />}>
            <For each={notes()}>
              {(note, i) =>
                <li class="list-row bg-base-100 rounded-box shadow-glass items-center">
                  <div class="list-col-grow">{note.name}</div>
                  <div class="join">
                    <button
                      onclick={() => restoreNote(note.id, i())}
                      type="button"
                      class="join-item btn btn-sm"
                    >Restore</button>
                    <button
                      onclick={() => deleteNote(note.id, i())}
                      type="button"
                      class="join-item btn btn-sm btn-error btn-outline"
                    ><Icon name="trash" /></button>
                  </div>
                </li>
              }
            </For>
          </Suspense>
        </ul>
      </div>
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
        name: form.name,
        slug: form.slug,
        isPublic: form.isPublic
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
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Book Details</legend>
          <label class="input validator">
            Title
            <input
              oninput={(ev) => setForm({
                name: ev.currentTarget.value,
              })}
              value={form.name}
              type="text"
              placeholder="e.g. My Amazing Book"
              required
            />
          </label>
          <label class="input validator">
            Slug
            <input
              oninput={(ev) => setForm({
                slug: toSlug(ev.currentTarget.value)
              })}
              value={form.slug}
              type="text"
              placeholder="e.g. my-amazing-book"
              pattern="(?:[a-z0-9]|-)+"
              required
            />
          </label>
          <label class="label justify-between">
            Public
            <input
              onchange={() => setForm({ isPublic: !form.isPublic })}
              checked={form.isPublic}
              class="toggle"
              type="checkbox"
            />
          </label>
        </fieldset>
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
