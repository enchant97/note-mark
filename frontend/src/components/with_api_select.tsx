import { Component, JSX, createSignal, onMount } from "solid-js";
import { useApi } from "../contexts/ApiProvider";
import { ToastType, useToast } from "../contexts/ToastProvider";
import Api from "../core/api";

type WithApiSelectProps = {
  children: JSX.Element
}

const WithApiSelect: Component<WithApiSelectProps> = (props) => {
  const { apiDetails, setApiDetails } = useApi()
  const { pushToast } = useToast()
  const [apiUrl, setApiUrl] = createSignal(apiDetails().apiServer)
  const [editMode, setEditMode] = createSignal(false)
  const [loading, setLoading] = createSignal(false)

  onMount(async () => {
    if (apiDetails().info) return
    setLoading(true)
    let result = await new Api({ apiServer: apiUrl() }).getServerInfo()
    setLoading(false)
    if (result instanceof Error) {
      setApiDetails({ authToken: undefined, info: undefined })
      setEditMode(true)
      pushToast({ message: "failed to validate compatible API server", type: ToastType.ERROR })
    } else {
      setApiDetails({ apiServer: apiUrl(), authToken: undefined, info: result })
    }
  })

  const validateAPI = async () => {
    setLoading(true)
    let url = apiUrl().replace(/\/$/g, "")
    let result = await new Api({ apiServer: url }).getServerInfo()
    setLoading(false)
    if (result instanceof Error) {
      setApiDetails({ authToken: undefined, info: undefined })
      pushToast({ message: "failed to validate compatible API server", type: ToastType.ERROR })
    }
    else {
      setEditMode(false)
      setApiDetails({ apiServer: url, authToken: undefined, info: result })
      pushToast({ message: "set new API server", type: ToastType.SUCCESS })
    }
  }

  return (
    <>
      <label class="form-control">
        <span class="label"><span class="label-text">API Server</span></span>
        <div class="join">
          <input
            value={apiUrl()}
            oninput={(ev) => setApiUrl(ev.currentTarget.value)}
            class="input input-sm w-full join-item"
            classList={{
              "input-bordered": editMode(),
            }}
            type="url"
            readonly={!editMode()}
            placeholder="e.g. https://example.com/api"
            required
          />
          <button
            onclick={() => {
              if (editMode()) validateAPI()
              else {
                setApiDetails({ authToken: undefined, info: undefined })
                setEditMode(true)
              }
            }}
            class="btn btn-sm join-item"
            classList={{
              loading: loading(),
              "btn-warning": editMode()
            }}
            type="button"
          >
            {editMode() && "Save" || "Edit"}
          </button>
        </div>
      </label>
      {props.children}
    </>
  )
}

export default WithApiSelect
