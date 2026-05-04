import { For, Show } from "solid-js";
import { AccessControl, AccessControlMode } from "~/core/types";
import Icon from "../Icon";
import { createStore } from "solid-js/store";

export default function AccessControlEditor(props: {
  accessControl: AccessControl,
  setAccessControl: (v: AccessControl) => any
},
) {
  const [newUser, setNewUser] = createStore<{ username: string, mode: AccessControlMode }>({
    username: "",
    mode: "read",
  })
  return (
    <fieldset class="fieldset">
      <legend class="fieldset-legend">Access Control</legend>
      <label class="label">
        <span>Public Read</span>
        <input
          class="checkbox"
          onChange={() => {
            props.setAccessControl({
              publicRead: !props.accessControl.publicRead,
              users: props.accessControl.users,
            })
          }}
          checked={props.accessControl.publicRead}
          type="checkbox"
          name="accessControlPublicRead"
          value={1}
        />
      </label>
      <div class="rounded-box bg-base-100 shadow-glass">
        <div class="flex gap-2 p-4 items-center">
          <label class="input">
            Username
            <input
              type="text"
              placeholder="e.g. leo"
              value={newUser.username}
              onInput={(ev) => setNewUser({ username: ev.currentTarget.value })}
              autocorrect="off"
              autocomplete="off"
              autocapitalize="off"
            />
          </label>
          <select
            class="select max-w-min"
            onChange={(ev) => setNewUser({ mode: ev.currentTarget.value })}
          >
            <option selected={newUser.mode === "read"} value="read">READ</option>
            <option selected={newUser.mode === "write"} value="write">WRITE</option>
          </select>
          <button
            class="btn btn-square btn-outline btn-success"
            onClick={() => {
              if (newUser.username.length !== 0) {
                const users = props.accessControl.users ?? {}
                props.setAccessControl({
                  ...props.accessControl,
                  users: { ...users, [newUser.username]: newUser.mode },
                })
                setNewUser({ username: "", mode: "read" })
              }
            }}
            type="button"
            aria-label="Add User Access"
          ><Icon name="user-plus" /></button>
        </div>
        <Show when={props.accessControl?.users}>{users => (
          <ul class="list">
            <For each={Object.entries(users())}>{([username, acMode]) => (
              <li class="list-row">
                <div class="list-col-grow flex gap-2 items-center">
                  <span class="flex-1">{username}</span>
                  <span
                    class="badge badge-outline"
                    classList={{
                      "badge-info": acMode === "read",
                      "badge-warning": acMode === "write",
                    }}
                  >{acMode.toUpperCase()}</span>
                </div>
                <button
                  class="btn btn-sm btn-square btn-outline btn-error"
                  type="button"
                  onClick={() => {
                    let users = Object.fromEntries(
                      Object.entries(props.accessControl.users!).filter(([k, _]) => k !== username))
                    props.setAccessControl({
                      publicRead: props.accessControl.publicRead,
                      users,
                    })
                  }}
                ><Icon name="trash" /></button>
                <input type="hidden" name="accessControlByUser" value={`${username}:${acMode}`} />
              </li>
            )}</For>
          </ul>
        )}
        </Show>
      </div>
    </fieldset>
  )
}
