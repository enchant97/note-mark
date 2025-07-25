import { Component, createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import { useNavigate } from '@solidjs/router';
import BaseModal from '~/components/modals/base';
import { Book, CreateBook, User } from '~/core/types';
import { toSlug, toSlugWithSuffix } from '~/core/helpers';
import { useApi } from '~/contexts/ApiProvider';
import { ApiError } from '~/core/api';
import { apiErrorIntoToast, useToast } from '~/contexts/ToastProvider';
import Icon from '~/components/icon';

type NewBookModalProps = {
  onClose: (newBook?: Book) => void
  user: User
}

const NewBookModal: Component<NewBookModalProps> = (props) => {
  const { api } = useApi()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = createStore<CreateBook>({ name: "", slug: "", isPublic: false })
  const [loading, setLoading] = createSignal(false)

  const onSubmit = async (ev: Event) => {
    ev.preventDefault()
    setLoading(true)
    let result = await api().createBook(form)
    setLoading(false)
    if (result instanceof ApiError) pushToast(apiErrorIntoToast(result, "creating book"))
    else {
      navigate(`/${props.user.username}/${form.slug}`)
      props.onClose(result)
    }
  }

  return (
    <BaseModal title="Create Book">
      <form onsubmit={onSubmit}>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Book details</legend>
          <label class="input validator">
            Title
            <input
              oninput={(ev) => setForm({
                name: ev.currentTarget.value,
                slug: toSlugWithSuffix(ev.currentTarget.value)
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
        <div class="modal-action">
          <button class="btn btn-primary" classList={{ loading: loading() }} type="submit">
            <Icon name="folder-plus" />
            Create
          </button>
          <button onclick={() => props.onClose()} class="btn" type="button">Cancel</button>
        </div>
      </form>
    </BaseModal>
  );
};

export default NewBookModal;
