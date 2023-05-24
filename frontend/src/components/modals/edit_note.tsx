import { Component, createSignal } from 'solid-js';
import BaseModal from './base';
import { Book, Note, UpdateNote, User } from '../../core/types';
import { createStore } from 'solid-js/store';
import { toSlug } from '../../core/helpers';
import { useApi } from '../../contexts/ApiProvider';
import { useNavigate } from '@solidjs/router';

type UpdateNoteModalProps = {
  onClose: (note?: Note) => void
  onDeleteClose: (noteId: string) => void
  user: User
  book: Book
  note: Note
}

const UpdateNoteModal: Component<UpdateNoteModalProps> = (props) => {
  const { api } = useApi()
  const navigate = useNavigate()
  const [form, setForm] = createStore<UpdateNote>(props.note)
  const [loading, setLoading] = createSignal(false)

  const onSubmit = async (ev: Event) => {
    ev.preventDefault()
    setLoading(true)
    let result = await api().updateNote(props.note.id, form)
    setLoading(false)
    result.unwrap()
    navigate(`/${props.user.username}/${props.book.slug}/${form.slug}`)
    props.onClose({
      id: props.note.id,
      bookId: props.note.bookId,
      name: form.name || props.note.name,
      slug: form.slug || props.note.slug,
    })
  }

  const onDelete = async () => {
    setLoading(true)
    let result = await api().deleteNote(props.note.id)
    setLoading(false)
    result.unwrap()
    navigate(`/${props.user.username}/${props.book.slug}`)
    props.onDeleteClose(props.note.id)
  }

  return (
    <BaseModal title="Update Note">
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
            placeholder="e.g. My Amazing Note"
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
            placeholder="e.g. my-amazing-note"
            pattern="(?:[a-z0-9]|-)+"
            required
          />
        </label>
        <div class="modal-action">
          <button onclick={onDelete} class="btn btn-outline btn-error" classList={{ loading: loading() }} type="button">Delete</button>
          <button class="btn btn-primary" classList={{ loading: loading() }} type="submit">Save</button>
          <button onclick={() => props.onClose()} class="btn" type="button">Cancel</button>
        </div>
      </form>
    </BaseModal>
  );
};

export default UpdateNoteModal;
