import { Component, createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import BaseModal from '~/components/modals/base';
import { apiErrorIntoToast, ToastType, useToast } from '~/contexts/ToastProvider';
import Api, { HttpErrors } from '~/core/api';

type UpdateUserPasswordModalProps = {
  onClose: () => void
}

const UpdateUserPasswordModal: Component<UpdateUserPasswordModalProps> = (props) => {
  const { pushToast } = useToast()
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
    try {
      await Api.updateUserPassword({
        existingPassword: form.existingPassword,
        newPassword: form.newPassword,
      })
      props.onClose()
    } catch (err) {
      if (err.status === HttpErrors.Forbidden) {
        pushToast({
          message: "existing password not accepted, did you type it correctly?",
          type: ToastType.ERROR,
        })
      } else {
        pushToast(apiErrorIntoToast(err, "updating new password"))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <BaseModal title="Update Password">
      <form onsubmit={onSubmit}>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Password details</legend>
          <label class="input validator">
            Current Password
            <input
              oninput={(ev) => setForm({
                existingPassword: ev.currentTarget.value,
              })}
              value={form.existingPassword}
              type="password"
              placeholder="e.g. P@ssword123"
              autocomplete="current-password"
              required
            />
          </label>
          <label class="input validator">
            New Password
            <input
              oninput={(ev) => setForm({
                newPassword: ev.currentTarget.value,
              })}
              value={form.newPassword}
              type="password"
              placeholder="e.g. Qwerty@123"
              autocomplete="new-password"
              required
            />
          </label>
          <label class="input validator">
            Confirm New Password
            <input
              oninput={(ev) => setForm({
                newPasswordConfirm: ev.currentTarget.value,
              })}
              value={form.newPasswordConfirm}
              classList={{ "input-error": !passwordsMatch() }}
              type="password"
              placeholder="e.g. Qwerty@123"
              autocomplete="new-password"
              required
            />
          </label>
        </fieldset>
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
