import { Component, createSignal } from "solid-js";
import BaseModal from "./base";

type ApiUrlModal = {
  onClose: (newUrl?: string) => void
  apiUrl: string
}

const ApiUrlModal: Component<ApiUrlModal> = (props) => {
  const [apiUrl, setApiUrl] = createSignal(props.apiUrl)

  const onSubmit = (ev: Event) => {
    ev.preventDefault()
    let url = apiUrl().replace(/\/$/g, "")
    props.onClose(url)
  }

  return (
    <BaseModal title="Change Server">
      <form>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Enter Server URL</span>
          </label>
          <input
            value={apiUrl()}
            oninput={(ev) => setApiUrl(ev.currentTarget.value)}
            type="url"
            placeholder="https://example.com"
            class="input input-bordered w-full"
          />
        </div>
        <div class="modal-action">
          <button onclick={() => props.onClose()} class="btn" type="button">Cancel</button>
          <button onclick={onSubmit} class="btn btn-primary" type="submit">Set</button>
        </div>
      </form>
    </BaseModal>
  )
}

export default ApiUrlModal
