import { Component, For, Match, Show, Switch, createResource, createSignal } from "solid-js";
import BaseModal from "~/components/modals/base";
import { useApi } from "~/contexts/ApiProvider";
import { ToastType, apiErrorIntoToast, useToast } from "~/contexts/ToastProvider";
import { ApiError } from "~/core/api";
import { createStore } from "solid-js/store";
import Icon from "~/components/icon";
import { copyToClipboard } from "~/core/helpers";

type AssetsModalProps = {
  onClose: () => any
  noteId: string
  allowEdit: boolean
}

const AssetsModal: Component<AssetsModalProps> = (props) => {
  let assetUploadInput: HTMLInputElement

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

  const [modifyLoading, setModifyLoading] = createSignal(false)

  const [form, setForm] = createStore({
    name: "",
    file: null,
  })

  const onCreateSubmit = async (ev: Event) => {
    ev.preventDefault()
    setModifyLoading(true)
    if (form.file !== null) {
      if (form.name === "") {
        setForm({ name: form.file.name })
      }
      const result = await api().createNoteAsset(props.noteId, form.file, form.name)
      if (result instanceof ApiError) {
        pushToast(apiErrorIntoToast(result, "uploading asset"))
      } else {
        mutate([...assets() || [], result])
        assetUploadInput.value = null
        setForm({
          name: "",
          file: null,
        })
      }
    }
    setModifyLoading(false)
  }

  const onAssetDelete = async (assetId: string) => {
    setModifyLoading(true)
    const result = await api().deleteNoteAsset(props.noteId, assetId)
    if (result instanceof ApiError) {
      pushToast(apiErrorIntoToast(result, "deleting asset"))
    } else {
      mutate(assets()?.filter(asset => asset.id !== assetId))
    }
    setModifyLoading(false)
  }

  return (
    <BaseModal title="Note Assets">
      <div class="flex flex-col gap-2 bg-base-200 rounded p-2">
        <Show when={props.allowEdit}>
          <form onSubmit={onCreateSubmit} class="bg-base-100 p-2 rounded">
            <span class="text-md font-bold">New Asset</span>
            <label class="form-control">
              <span class="label">Asset</span>
              <input
                ref={assetUploadInput}
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
            <button
              disabled={modifyLoading()}
              class="btn btn-primary mt-2"
              type="submit"
            >
              Upload
            </button>
          </form>
        </Show>
        <div class="bg-base-100 rounded p-2">
          <span class="text-md font-bold">Existing Assets</span>
          <div class="overflow-auto max-h-48 mt-2">
            <table class="table table-sm">
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
                      <td class="avatar"><Switch>
                        <Match when={asset.info.mimeType.startsWith("image")}>
                          <div class="mask mask-squircle w-12 h-12">
                            <img src={api().getNoteAssetAccessUrl(props.noteId, asset.id)} />
                          </div>
                        </Match>
                      </Switch></td>
                      <td>
                        <div class="join flex justify-end">
                          <button
                            class="btn join-item"
                            title={`Copy Link "${asset.name}"`}
                            onClick={async () => {
                              let assetUrl = api().getNoteAssetAccessUrl(props.noteId, asset.id)
                              try {
                                await copyToClipboard(assetUrl)
                                pushToast({ message: "copied to clipboard", type: ToastType.SUCCESS })
                              } catch (err) {
                                pushToast({ message: err.message, type: ToastType.ERROR })
                              }
                            }}
                          >
                            <Icon name="link" />
                          </button>
                          <a
                            class="btn join-item"
                            href={api().getNoteAssetAccessUrl(props.noteId, asset.id)}
                            target="_blank"
                            title={`Open "${asset.name}"`}
                          >
                            <Icon name="external-link" />
                          </a>
                          <button
                            onClick={() => onAssetDelete(asset.id)}
                            disabled={modifyLoading()}
                            class="btn btn-outline btn-error join-item"
                            title={`Delete "${asset.name}"`}
                          >
                            <Icon name="trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="modal-action">
        <button
          onClick={() => props.onClose()}
          classList={{
            "loading": modifyLoading(),
            "loading-spinner": modifyLoading(),
          }}
          class="btn"
          type="button"
        >
          Close
        </button>
      </div>
    </BaseModal>
  )
}

export default AssetsModal
