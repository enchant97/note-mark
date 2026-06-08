import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import BaseModal from './Base';
import { User } from '~/core/types';
import { apiErrorIntoToast, useToast } from '~/contexts/ToastProvider';
import Api from '~/core/api';

type UpdateUserModalProps = {
  onClose: (user?: User) => void
  user: User
}

export default function UpdateUserModal(props: UpdateUserModalProps) {
  const { pushToast } = useToast()
  const [form, setForm] = createStore(props.user)
  const [loading, setLoading] = createSignal(false)

  const onSubmit = async (ev: Event) => {
    ev.preventDefault()
    setLoading(true)
    try {
      await Api.updateUser(props.user.username, { name: form.name ?? null })
      props.onClose({ ...props.user, name: form.name })
    } catch (err) {
      pushToast(apiErrorIntoToast(err, "saving profile"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <BaseModal title="Update Profile">
      <form onsubmit={onSubmit}>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">User details</legend>
          <label class="input validator">
            Full Name
            <input
              oninput={(ev) => setForm({
                name: ev.currentTarget.value,
              })}
              value={form.name ?? ""}
              type="text"
              placeholder="e.g. Leo S"
              maxlength={128}
              required
            />
          </label>
        </fieldset>
        <div class="modal-action">
          <button class="btn btn-primary" classList={{ loading: loading() }} type="submit">Save</button>
          <button onclick={() => props.onClose()} class="btn" type="button">Cancel</button>
        </div>
      </form>
    </BaseModal>
  )
}
