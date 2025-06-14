import { Component, For, createResource, createSignal } from "solid-js";
import { A } from "@solidjs/router";
import BaseModal from "~/components/modals/base";
import { useApi } from "~/contexts/ApiProvider";
import { ApiError } from "~/core/api";
import { apiErrorIntoToast, useToast } from "~/contexts/ToastProvider";
import Icon from "../icon";

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
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Search By Username</legend>
        <label class="input validator">
          <Icon name="user" />
          Username
          <input
            value={username()}
            oninput={(ev) => setUsername(ev.currentTarget.value)}
            type="text"
            placeholder="e.g. leo"
            pattern="[A-Za-z0-9]+"
            required
          />
        </label>
      </fieldset>
      <ul class="my-4 menu gap-2 p-2 overflow-y-auto h-40 max-h-40 lg:h-80 lg:max-h-80 w-full">
        <For each={users()}>
          {user => <li><A class="btn justify-start" onclick={() => props.onClose()} href={`/${user}`}>{user}</A></li>}
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
