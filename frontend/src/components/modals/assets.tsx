import { NodeSlug } from "~/core/types";
import BaseModal from "./Base";
import Icon from "../Icon";
import { createStore } from "solid-js/store";
import { createEffect, For, Show } from "solid-js";
import { action, useAction, useSubmission } from "@solidjs/router";
import Api from "~/core/api";
import AlertBox from "../AlertBox";
import { copyToClipboard } from "~/core/helpers";
import { ToastType, useToast } from "~/contexts/ToastProvider";

export interface AssetEntry {
  fullSlug: NodeSlug | null
  modTime: string
}

const createAssetAction = action(async (where: { username: string, parentSlug: string }, formData: FormData) => {
  const slug = formData.get("filename")?.toString()
  const file = formData.get("file")
  if (slug === undefined || file === null || !(file instanceof Blob)) {
    throw "invalid form data"
  }
  const fullSlug = `${where.parentSlug}/${slug}`
  await Api.updateNodeContent(where.username, fullSlug, file)
  return {
    ok: true,
    slug,
    assetEntry: {
      fullSlug,
      modTime: (new Date()).toISOString(),
    },
  }
})

const deleteAssetAction = action(async (where: { username: string, parentSlug: string }, slug: string) => {
  // permanently delete node
  if (where.parentSlug.startsWith(".trash/")) {
    await Api.deleteNode(where.username, `${where.parentSlug}/${slug}`)
    return {
      ok: true,
      slug,
      parentFullSlug: null,
    }
  }
  // move to node trash
  const newFullSlug = await Api.moveNodeToTrash(where.username, `${where.parentSlug}/${slug}`)
  return {
    ok: true,
    slug,
    parentFullSlug: newFullSlug.split("/").slice(0, -1).join("/"),
  }
})

export default function AssetsModal(props: {
  currentUsername: string,
  currentParentSlug: string,
  assets: Record<NodeSlug, AssetEntry>,
  onClose: (assets: Record<NodeSlug, AssetEntry>) => any,
}) {
  let assetUploadInput: HTMLInputElement
  const { pushToast } = useToast()
  const [createFields, setCreateFields] = createStore<{ slug: string, file: File | null }>({
    slug: "",
    file: null,
  })
  const [currentAssets, setCurrentAssets] = createStore<Record<NodeSlug, AssetEntry>>(props.assets)
  const deleteAsset = useAction(deleteAssetAction)
  const createSubmission = useSubmission(createAssetAction)
  const deleteSubmission = useSubmission(deleteAssetAction)
  const globalLoading = () => createSubmission.pending || deleteSubmission.pending
  const currentAssetList = () => Object
    .values(currentAssets)
    .filter((v) => v.fullSlug !== null && v.fullSlug.startsWith(props.currentParentSlug))
  createEffect(() => {
    if (createSubmission.result === undefined) { return }
    setCreateFields({ slug: "", file: null })
    setCurrentAssets(createSubmission.result.slug, createSubmission.result.assetEntry)
    assetUploadInput.value = null
  }, { name: "onCreateSubmission" })
  createEffect(() => {
    if (deleteSubmission.result === undefined) { return }
    if (deleteSubmission.result.parentFullSlug === null) {
      // handle permanent deletion
      setCurrentAssets(deleteSubmission.result.slug, {
        fullSlug: null,
        modTime: (new Date()).toISOString(),
      })
    } else {
      // handle move to trash
      setCurrentAssets(deleteSubmission.result.slug, {
        fullSlug: `${deleteSubmission.result.parentFullSlug}/${deleteSubmission.result.slug}`,
        modTime: (new Date()).toISOString(),
      })
    }
  }, { name: "onDeleteSubmission" })
  return (
    <BaseModal title="Assets">
      <form class="shadow-glass rounded-box p-4 my-2" action={createAssetAction.with({
        username: props.currentUsername,
        parentSlug: props.currentParentSlug,
      })} method="post" enctype="multipart/form-data">
        <span class="text-md font-bold">Upload Asset</span>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">File</legend>
          <input
            ref={assetUploadInput}
            onChange={(ev) => {
              const file = ev.currentTarget.files?.item(0) ?? null
              setCreateFields({ slug: file?.name || "", file })
            }}
            class="file-input w-full"
            name="file"
            type="file"
            aria-label="file"
            required
          />
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Filename</legend>
          <input
            value={createFields.slug}
            onInput={(ev) => setCreateFields({ slug: ev.currentTarget.value })}
            class="input validator"
            name="filename"
            type="text"
            placeholder="e.g. my-img.jpg"
            aria-label="filename"
            autocorrect="off"
            autocomplete="off"
            autocapitalize="off"
            required
          />
        </fieldset>
        <button class="btn" type="submit" disabled={globalLoading()}>
          <Icon name="upload" />
          Upload
        </button>
      </form>
      <div class="shadow-glass rounded-box p-4 my-2">
        <span class="text-md font-bold">Existing Assets</span>
        <ul class="list gap-2">
          <For each={currentAssetList()}>
            {asset => {
              const assetSlug = asset.fullSlug!.split("/").pop()!
              return (
                <li class="list-row bg-base-100 rounded-box shadow-glass items-center">
                  <div><Icon name="file" /></div>
                  <div>{asset.fullSlug!.split("/").pop()}</div>
                  <div class="join">
                    <button
                      class="btn btn-sm join-item"
                      title={`Copy Link "${assetSlug}"`}
                      onClick={async () => {
                        let assetUrl = Api.makeAssetUrl(props.currentUsername, asset.fullSlug!)
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
                      href={Api.makeAssetUrl(props.currentUsername, asset.fullSlug!)}
                      target="_blank"
                      title={`Open "${assetSlug}"`}
                    >
                      <Icon name="external-link" />
                    </a>
                    <button
                      onClick={() => {
                        deleteAsset({
                          username: props.currentUsername,
                          parentSlug: props.currentParentSlug,
                        },
                          assetSlug)
                      }}
                      disabled={globalLoading()}
                      class="btn btn-sm btn-outline btn-error join-item"
                      title={`Delete "${assetSlug}"`}
                    >
                      <Icon name="trash" />
                    </button>
                  </div>
                </li>
              )
            }}
          </For>
        </ul>
      </div>
      <Show when={createSubmission.error}>{err =>
        <AlertBox content={err()} level="error" />
      }</Show>
      <Show when={deleteSubmission.error}>{err =>
        <AlertBox content={err()} level="error" />
      }</Show>
      <div class="modal-action">
        <button
          onClick={() => {
            deleteSubmission.clear()
            createSubmission.clear()
            props.onClose(currentAssets)
          }}
          disabled={globalLoading()}
          class="btn"
          type="button"
        >Close</button>
      </div>
    </BaseModal>
  )
}
