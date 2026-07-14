import { createStore } from 'solid-js/store';
import BaseModal from './Base';
import Api from '~/core/api';
import { action, useSubmission } from '@solidjs/router';
import { createEffect, Show } from 'solid-js';
import AlertBox from '../AlertBox';

const updateUserPasswordAction = action(async (where: { username: string }, formData: FormData) => {
  const existingPassword = formData.get("existingPassword")?.toString()
  const newPassword = formData.get("newPassword")?.toString()
  if (existingPassword === undefined || newPassword === undefined) {
    throw "invalid form data"
  }
  await Api.updateUserPassword(where.username, {
    existingPassword,
    newPassword,
  })
  return {
    ok: true,
  } as const
})

export default function UpdateUserPasswordModal(props: {
  username: string,
  onClose: () => void,
}) {
  const [form, setForm] = createStore({
    existingPassword: "",
    newPassword: "",
    newPasswordConfirm: "",
  })
  const submission = useSubmission(updateUserPasswordAction)
  createEffect(() => {
    if (submission.result?.ok) {
      props.onClose()
    }
  })
  const passwordsMatch = () => form.newPassword === form.newPasswordConfirm
  return (
    <BaseModal title="Update Password">
      <form action={updateUserPasswordAction.with({
        username: props.username,
      })} method="post">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Password details</legend>
          <label class="input validator">
            Current Password
            <input
              name="existingPassword"
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
              name="newPassword"
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
              name="newPasswordConfirm"
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
        <Show when={submission.error}>{err =>
          <AlertBox content={err()} level="error" />
        }</Show>
        <div class="modal-action">
          <button
            class="btn btn-primary"
            disabled={!passwordsMatch() || submission.pending}
            classList={{ loading: submission.pending }}
            type="submit">
            Save
          </button>
          <button onclick={() => props.onClose()} class="btn" type="button">Cancel</button>
        </div>
      </form>
    </BaseModal>
  )
}
