import { Component, createSignal } from 'solid-js';
import BaseModal from './base';
import { Book, UpdateBook, User } from '../../core/types';
import { createStore } from 'solid-js/store';
import { toSlug } from '../../core/helpers';
import { useApi } from '../../contexts/ApiProvider';
import { useNavigate } from '@solidjs/router';

type UpdateBookModalProps = {
  onClose: (book?: Book) => void
  onDeleteClose: (bookId: string) => void
  user: User
  book: Book
}

const UpdateBookModal: Component<UpdateBookModalProps> = (props) => {
  const { api } = useApi()
  const navigate = useNavigate()
  const [form, setForm] = createStore<UpdateBook>(props.book)
  const [loading, setLoading] = createSignal(false)

  const onSubmit = async (ev: Event) => {
    ev.preventDefault()
    setLoading(true)
    let result = await api().updateBook(props.book.id, form)
    setLoading(false)
    result.unwrap()
    navigate(`/${props.user.username}/${form.slug}`)
    props.onClose({
      id: props.book.id,
      ownerId: props.book.ownerId,
      name: form.name || props.book.name,
      slug: form.slug || props.book.slug,
      isPublic: form.isPublic || props.book.isPublic
    })
  }

  const onDelete = async () => {
    setLoading(true)
    let result = await api().deleteBook(props.book.id)
    setLoading(false)
    result.unwrap()
    navigate(`/${props.user.username}`)
    props.onDeleteClose(props.book.id)
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
        <div class="modal-action">
          <button onclick={onDelete} class="btn btn-outline btn-error" classList={{ loading: loading() }} type="button">Delete</button>
          <button class="btn btn-primary" classList={{ loading: loading() }} type="submit">Save</button>
          <button onclick={() => props.onClose()} class="btn" type="button">Cancel</button>
        </div>
      </form>
    </BaseModal>
  );
};

export default UpdateBookModal;
