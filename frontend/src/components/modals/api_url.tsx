import { Component, createSignal } from "solid-js";
import { ToastType, useToast } from "../../contexts/ToastProvider";
import Api, { ApiError } from "../../core/api";
import BaseModal from "./base";

type ApiUrlModalProps = {
  onClose: (newUrl?: string) => void
  apiUrl: string
}

const ApiUrlModal: Component<ApiUrlModalProps> = (props) => {
  const [apiUrl, setApiUrl] = createSignal(props.apiUrl)
  const { pushToast } = useToast()
  const [loading, setLoading] = createSignal(false)

  const onSubmit = async (ev: Event) => {
    ev.preventDefault()
    setLoading(true)
    let url = apiUrl().replace(/\/$/g, "")
    let result = await new Api({ apiServer: url }).getServerInfo()
    setLoading(false)
    if (result instanceof ApiError) {
      pushToast({ message: "failed to validate compatible API server", type: ToastType.ERROR })
    } else {
      // TODO validate api min supported version
      pushToast({ message: "new API server set", type: ToastType.SUCCESS })
      props.onClose(url)
    }
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
          <button
            onclick={onSubmit}
            class="btn btn-primary"
            classList={{ loading: loading() }}
            disabled={loading()}
            type="submit">
            Set
          </button>
          <button onclick={() => props.onClose()} class="btn" type="button">Cancel</button>
        </div>
      </form>
    </BaseModal>
  )
}

export default ApiUrlModal
