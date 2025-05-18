import { Component, For, createResource, createSignal } from "solid-js";
import { A } from "@solidjs/router";
import BaseModal from "~/components/modals/base";
import { useApi } from "~/contexts/ApiProvider";
import { ApiError } from "~/core/api";
import { apiErrorIntoToast, useToast } from "~/contexts/ToastProvider";

type UserSearchModalProps = {
  onClose: () => void
}

const UserSearchModal: Component<UserSearchModalProps> = (props) => {
  const { api } = useApi()
  const { pushToast } = useToast()
  const [username, setUsername] = createSignal("")

  const sanitisedUsername = () => username().replaceAll(/[^A-Za-z0-9]/g, "")

  const [users] = createResource(sanitisedUsername, async (username) => {
    if (!username) return
    let result = await api().getUsersSearch(username)
    if (result instanceof ApiError) {
      pushToast(apiErrorIntoToast(result, "searching for users"))
      return
    } else return result
  })

  return (
    <BaseModal title="Find User">
      <label class="form-control">
        <span class="label"><span class="label-text">Username</span></span>
        <input
          value={username()}
          oninput={(ev) => setUsername(ev.currentTarget.value)}
          class="input input-sm input-bordered w-full"
          type="text"
          placeholder="e.g. leo"
          pattern="[A-Za-z0-9]+"
          required
        />
      </label>
      <ul class="my-4 menu gap-2 p-2 overflow-y-auto h-40 max-h-40 lg:h-80 lg:max-h-80 bg-base-200 rounded-lg">
        <For each={users()}>
          {user => <li><A onclick={() => props.onClose()} href={`/${user}`}>{user}</A></li>}
        </For>
      </ul>
      <div class="modal-action">
        <button
          onclick={() => props.onClose()}
          class="btn"
          disabled={users.loading}
          type="button"
        >
          {users.loading && <span class="loading loading-spinner"></span>}
          Close
        </button>
      </div>
    </BaseModal>
  )
}

export default UserSearchModal
