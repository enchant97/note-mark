import { Component, For, Show, createResource, createSignal } from "solid-js";
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
      <Show when={props.allowEdit}>
        <form class="shadow-glass rounded-box p-4 my-2" onSubmit={onCreateSubmit}>
          <span class="text-md font-bold">New Asset</span>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Asset details</legend>
            <input
              ref={assetUploadInput}
              onChange={(ev) => {
                const file = ev.currentTarget.files?.item(0) || null
                setForm({ file, name: "" })
              }}
              class="file-input w-full"
              type="file"
              aria-label="Asset"
              required
            />
            <label class="input validator">
              Name
              <input
                value={form.name}
                onInput={(ev) => setForm({ name: ev.currentTarget.value })}
                type="text"
                placeholder="e.g. my-cat.png"
              />
            </label>
          </fieldset>
          <button
            disabled={modifyLoading()}
            class="btn btn-primary"
            type="submit"
          >
            Upload
          </button>
        </form>
      </Show>
      <div class="shadow-glass rounded-box p-4 my-2">
        <span class="text-md font-bold">Existing Assets</span>
        <div class="overflow-auto max-h-48 mt-2">
          <ul class="list gap-2">
            <For each={assets()}>
              {asset => (
                <li class="list-row bg-base-100 rounded-box shadow-glass items-center">
                  <div>
                    <Show when={asset.info.mimeType.startsWith("image")} fallback={<Icon name="file" />}>
                      <img class="size-10 rounded-box" src={api().getNoteAssetAccessUrl(props.noteId, asset.id)} />
                    </Show>
                  </div>
                  <div>{asset.name}</div>
                  <div class="join">
                    <button
                      class="btn btn-sm join-item"
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
                      class="btn btn-sm join-item"
                      href={api().getNoteAssetAccessUrl(props.noteId, asset.id)}
                      target="_blank"
                      title={`Open "${asset.name}"`}
                    >
                      <Icon name="external-link" />
                    </a>
                    <button
                      onClick={() => onAssetDelete(asset.id)}
                      disabled={modifyLoading()}
                      class="btn btn-sm btn-outline btn-error join-item"
                      title={`Delete "${asset.name}"`}
                    >
                      <Icon name="trash" />
                    </button>
                  </div>
                </li>
              )}
            </For>
          </ul>
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
    </BaseModal >
  )
}

export default AssetsModal
