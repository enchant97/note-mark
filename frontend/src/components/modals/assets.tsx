import { Component, For, Match, Switch, createResource } from "solid-js";
import BaseModal from "./base";
import { useApi } from "../../contexts/ApiProvider";
import { apiErrorIntoToast, useToast } from "../../contexts/ToastProvider";
import { ApiError } from "../../core/api";
import { createStore } from "solid-js/store";
import Icon from "../icon";

type AssetsModalProps = {
  onClose: () => any
  noteId: string
}

const AssetsModal: Component<AssetsModalProps> = (props) => {
  const { api } = useApi()
  const { pushToast } = useToast()
  const [assets, { mutate }] = createResource(props.noteId, async (noteId) => {
    const result = await api().getNoteAssets(noteId)
    if (result instanceof ApiError) {
      pushToast(apiErrorIntoToast(result, "loading assets"))
      return []
    } else {
      return result
    }
  })

  const [form, setForm] = createStore({
    name: "",
    file: null,
  })

  const onCreateSubmit = async (ev: Event) => {
    ev.preventDefault()
    if (form.file !== null) {
      if (form.name === "") {
        setForm({ name: form.file.name })
      }
      const result = await api().createNoteAsset(props.noteId, form.file, form.name)
      if (result instanceof ApiError) {
        pushToast(apiErrorIntoToast(result, "uploading asset"))
      } else {
        mutate([...assets() || [], result])
      }
    }
  }

  return (
    <BaseModal title="Note Assets">
      <div class="flex flex-col gap-2">
        <form onSubmit={onCreateSubmit} class="bg-base-200 p-2 rounded">
          <span class="text-md font-bold">New Asset</span>
          <label class="form-control">
            <span class="label">Asset</span>
            <input
              onChange={(ev) => {
                const file = ev.currentTarget.files?.item(0) || null
                setForm({ file, name: "" })
              }}
              class="file-input file-input-bordered w-full"
              type="file"
              required
            />
          </label>
          <label class="form-control">
            <span class="label">Name</span>
            <input
              value={form.name}
              onInput={(ev) => setForm({ name: ev.currentTarget.value })}
              class="input input-bordered w-full"
              type="text"
              placeholder="e.g. my cat"
            />
          </label>
          <button class="btn btn-primary mt-2" type="submit">Upload</button>
        </form>
        <div class="bg-base-200 p-2 rounded">
          <span class="text-md font-bold">Existing Assets</span>
          <table class="table table-sm max-h-40">
            <thead>
              <tr>
                <th>Name</th>
                <th>Preview</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <For each={assets()}>
                {asset => (
                  <tr>
                    <td>{asset.name}</td>
                    <td><Switch>
                      <Match when={asset.info.mimeType.startsWith("image")}>
                        <img class="w-24 rounded" src={api().getNoteAssetAccessUrl(props.noteId, asset.id)} />
                      </Match>
                    </Switch></td>
                    <td>
                      <a
                        class="btn btn-sm"
                        href={api().getNoteAssetAccessUrl(props.noteId, asset.id)}
                        target="_blank"
                        title={`Open "${asset.name}"`}
                      >
                        <Icon name="external-link" />
                      </a>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
        <div class="modal-action">
          <button onclick={() => props.onClose()} class="btn" type="button">Close</button>
        </div>
      </div>
    </BaseModal>
  )
}

export default AssetsModal
