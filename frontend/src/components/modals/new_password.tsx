import { Component, createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import BaseModal from '~/components/modals/base';
import { useApi } from '~/contexts/ApiProvider';
import { apiErrorIntoToast, ToastType, useToast } from '~/contexts/ToastProvider';
import { ApiError, HttpErrors } from '~/core/api';

type UpdateUserPasswordModalProps = {
  onClose: () => void
}

const UpdateUserPasswordModal: Component<UpdateUserPasswordModalProps> = (props) => {
  const { api } = useApi()
  const { pushToast } = useToast()
  const { userInfo } = useApi()
  const [form, setForm] = createStore({
    existingPassword: "",
    newPassword: "",
    newPasswordConfirm: "",
  })
  const [loading, setLoading] = createSignal(false)

  const passwordsMatch = () => form.newPassword === form.newPasswordConfirm

  const onSubmit = async (ev: Event) => {
    ev.preventDefault()
    setLoading(true)
    let result = await api().updateUserPassword({
      existingPassword: form.existingPassword,
      newPassword: form.newPassword,
    })
    setLoading(false)
    if (result instanceof ApiError) {
      if (result.status === HttpErrors.Forbidden) {
        pushToast({
          message: "existing password not accepted, did you type it correctly?",
          type: ToastType.ERROR,
        })
      } else {
        pushToast(apiErrorIntoToast(result, "updating new password"))
      }
    }
    else {
      props.onClose()
    }
  }

  return (
    <BaseModal title="Update Password">
      <form onsubmit={onSubmit}>
        <input type="text" autocomplete="username" value={userInfo()!.username} readonly class="hidden" />
        <label class="form-control">
          <span class="label"><span class="label-text">Current Password</span></span>
          <input
            oninput={(ev) => setForm({
              existingPassword: ev.currentTarget.value,
            })}
            value={form.existingPassword}
            class="input input-bordered w-full"
            type="password"
            placeholder="e.g. P@ssword123"
            autocomplete="current-password"
            required
          />
        </label>
        <label class="form-control">
          <span class="label"><span class="label-text">New Password</span></span>
          <input
            oninput={(ev) => setForm({
              newPassword: ev.currentTarget.value,
            })}
            value={form.newPassword}
            class="input input-bordered w-full"
            type="password"
            placeholder="e.g. Qwerty@123"
            autocomplete="new-password"
            required
          />
        </label>
        <label class="form-control">
          <span class="label"><span class="label-text">New Password Confirm</span></span>
          <input
            oninput={(ev) => setForm({
              newPasswordConfirm: ev.currentTarget.value,
            })}
            value={form.newPasswordConfirm}
            class="input input-bordered w-full"
            classList={{ "input-error": !passwordsMatch() }}
            type="password"
            placeholder="e.g. Qwerty@123"
            autocomplete="new-password"
            required
          />
        </label>
        <div class="modal-action">
          <button
            class="btn btn-primary"
            disabled={!passwordsMatch() || loading()}
            classList={{ loading: loading() }}
            type="submit">
            Save
          </button>
          <button onclick={() => props.onClose()} class="btn" type="button">Cancel</button>
        </div>
      </form>
    </BaseModal>
  )
}

export default UpdateUserPasswordModal
