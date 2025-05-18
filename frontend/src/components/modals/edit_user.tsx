import { Component, createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import BaseModal from '~/components/modals/base';
import { useApi } from '~/contexts/ApiProvider';
import { User, userIntoUpdateUser } from '~/core/types';
import { apiErrorIntoToast, useToast } from '~/contexts/ToastProvider';
import { ApiError } from '~/core/api';

type UpdateUserModalProps = {
  onClose: (user?: User) => void
  user: User
}

const UpdateUserModal: Component<UpdateUserModalProps> = (props) => {
  const { api } = useApi()
  const { pushToast } = useToast()
  const [form, setForm] = createStore(userIntoUpdateUser(props.user))
  const [loading, setLoading] = createSignal(false)

  const onSubmit = async (ev: Event) => {
    ev.preventDefault()
    setLoading(true)
    let result = await api().updateUser(form)
    setLoading(false)
    if (result instanceof ApiError) pushToast(apiErrorIntoToast(result, "saving profile"))
    else {
      props.onClose({ ...props.user, name: form.name })
    }
  }

  return (
    <BaseModal title="Update Profile">
      <form onsubmit={onSubmit}>
        <label class="form-control">
          <span class="label"><span class="label-text">Name</span></span>
          <input
            oninput={(ev) => setForm({
              name: ev.currentTarget.value,
            })}
            value={form.name}
            class="input input-bordered w-full"
            type="text"
            placeholder="e.g. Leo S"
            maxlength={128}
            required
          />
        </label>
        <div class="modal-action">
          <button class="btn btn-primary" classList={{ loading: loading() }} type="submit">Save</button>
          <button onclick={() => props.onClose()} class="btn" type="button">Cancel</button>
        </div>
      </form>
    </BaseModal>
  )
}

export default UpdateUserModal
