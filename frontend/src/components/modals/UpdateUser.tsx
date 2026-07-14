import { createEffect, Show } from 'solid-js';
import BaseModal from './Base';
import { User } from '~/core/types';
import Api from '~/core/api';
import { action, useSubmission } from '@solidjs/router';
import AlertBox from '../AlertBox';

const updateUserAction = action(async (where: { username: string }, formData: FormData) => {
  const fullName = formData.get("fullName")?.toString()
  if (fullName === undefined) {
    throw "invalid form data"
  }
  await Api.updateUser(where.username, { name: fullName || null })
  return {
    ok: true, data: {
      fullName,
    },
  }
})

export default function UpdateUserModal(props: {
  onClose: (user?: User) => void,
  user: User,
}) {
  const submission = useSubmission(updateUserAction)
  createEffect(() => {
    if (submission.result === undefined) { return }
    props.onClose({ ...props.user, ...submission.result.data })
  })
  return (
    <BaseModal title="Update Profile">
      <form action={updateUserAction.with({
        username: props.user.username,
      })} method="post">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">User details</legend>
          <label class="input validator">
            Full Name
            <input
              name="fullName"
              value={props.user.name ?? ""}
              type="text"
              placeholder="e.g. Leo S"
              maxlength={128}
              required
            />
          </label>
        </fieldset>
        <Show when={submission.error}>{err =>
          <AlertBox content={err()} level="error" />
        }</Show>
        <div class="modal-action">
          <button class="btn btn-primary" classList={{ loading: submission.pending }} type="submit">Save</button>
          <button onclick={() => props.onClose()} class="btn" type="button">Cancel</button>
        </div>
      </form>
    </BaseModal>
  )
}
