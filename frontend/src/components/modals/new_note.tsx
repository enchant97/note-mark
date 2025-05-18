import { Component, createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useNavigate } from '@solidjs/router';
import BaseModal from '~/components/modals/base';
import { Book, CreateNote, Note, User } from '~/core/types';
import { toSlug, toSlugWithSuffix } from '~/core/helpers';
import { useApi } from '~/contexts/ApiProvider';
import { ApiError } from '~/core/api';
import { apiErrorIntoToast, useToast } from '~/contexts/ToastProvider';
import Icon from '~/components/icon';

type NewNoteModalProps = {
  onClose: (newNote?: Note) => void
  user: User
  book: Book
}

const NewNoteModal: Component<NewNoteModalProps> = (props) => {
  const { api } = useApi()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = createStore<CreateNote>({ name: "", slug: "" })
  const [loading, setLoading] = createSignal(false)

  const onSubmit = async (ev: Event) => {
    ev.preventDefault()
    setLoading(true)
    let result = await api().createNote(props.book.id, form)
    setLoading(false)
    if (result instanceof ApiError) pushToast(apiErrorIntoToast(result, "creating note"))
    else {
      navigate(`/${props.user.username}/${props.book.slug}/${form.slug}`)
      props.onClose(result)
    }
  }

  return (
    <BaseModal title="Create Note">
      <form onsubmit={onSubmit}>
        <label class="form-control">
          <span class="label"><span class="label-text">Title</span></span>
          <input
            oninput={(ev) => setForm({
              name: ev.currentTarget.value,
              slug: toSlugWithSuffix(ev.currentTarget.value)
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
          <button class="btn btn-primary" classList={{ loading: loading() }} type="submit">
            <Icon name="file-plus" />
            Create
          </button>
          <button onclick={() => props.onClose()} class="btn" type="button">Cancel</button>
        </div>
      </form>
    </BaseModal>
  );
};

export default NewNoteModal;
