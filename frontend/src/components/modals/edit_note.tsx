import { Component, createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useNavigate } from '@solidjs/router';
import BaseModal from '~/components/modals/base';
import { Book, Note, noteIntoUpdateNote, User } from '~/core/types';
import { toSlug } from '~/core/helpers';
import { useApi } from '~/contexts/ApiProvider';
import { apiErrorIntoToast, useToast } from '~/contexts/ToastProvider';
import { ApiError } from '~/core/api';
import Icon from '~/components/icon';

type UpdateNoteModalProps = {
  onClose: (note?: Note) => void
  onDeleteClose: (noteId: string) => void
  user: User
  book: Book
  note: Note
}

const UpdateNoteModal: Component<UpdateNoteModalProps> = (props) => {
  const { api } = useApi()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = createStore(noteIntoUpdateNote(props.note))
  const [loading, setLoading] = createSignal(false)

  const onSubmit = async (ev: Event) => {
    ev.preventDefault()
    setLoading(true)
    let result = await api().updateNote(props.note.id, form)
    setLoading(false)

    if (result instanceof ApiError) pushToast(apiErrorIntoToast(result, "saving note"))
    else {
      navigate(`/${props.user.username}/${props.book.slug}/${form.slug}`)
      props.onClose({
        ...props.note,
        name: form.name || props.note.name,
        slug: form.slug || props.note.slug,
      })
    }
  }

  const onDelete = async () => {
    setLoading(true)
    let result = await api().deleteNote(props.note.id)
    setLoading(false)
    if (result instanceof ApiError) pushToast(apiErrorIntoToast(result, "deleting note"))
    else {
      navigate(`/${props.user.username}/${props.book.slug}`)
      props.onDeleteClose(props.note.id)
    }
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
          <button
            onclick={onDelete}
            class="btn btn-outline btn-error"
            disabled={loading()}
            type="button">
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

export default UpdateNoteModal;
