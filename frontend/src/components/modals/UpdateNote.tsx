import { action, useAction, useSubmission } from "@solidjs/router";
import BaseModal from "./Base";
import { AccessControl, AccessControlUsers, Frontmatter, NodeEntry } from "~/core/types";
import Icon from "../Icon";
import { createEffect, Show } from "solid-js";
import { createStore } from "solid-js/store";
import NoteFormFields from "../input/NoteFormFields";
import Api from "~/core/api";
import { isEqual } from "lodash";
import AccessControlEditor from "../input/AccessControlEditor";
import AlertBox from "../AlertBox";

const updateNoteAction = action(async (where: {
  username: string,
  currentFullSlug: string,
  currentFrontmatter: Frontmatter,
}, formData: FormData) => {
  const title = formData.get("title")?.toString()
  const acPublicRead = formData.get("accessControlPublicRead") === "1"
  const acByUser: AccessControlUsers = Object.fromEntries(
    (formData.getAll("accessControlByUser") ?? []).map((v) => v.toString().split(":")))
  const accessControl: AccessControl = {
    publicRead: acPublicRead,
    users: acByUser,
  }
  const slug = formData.get("slug")?.toString()
  const parentSlug = formData.get("parentSlug")?.toString()
  const extraProperties = formData.get("extraProperties")?.toString()
  if (title === undefined || slug === undefined || parentSlug === undefined || extraProperties === undefined) {
    throw "invalid form data"
  }
  const fullSlug = parentSlug
    ? `${parentSlug}/${slug}`
    : slug
  const frontmatter = {
    ...JSON.parse(extraProperties),
    title,
    accessControl,
  }
  // if frontmatter has changed, update
  // XXX can we get away with not using `lodash.isEqual()`
  if (!isEqual(where.currentFrontmatter, frontmatter)) {
    await Api.updateNoteNodeFrontmatter(where.username, where.currentFullSlug, frontmatter)
  }
  // if node has moved, update
  if (where.currentFullSlug !== fullSlug) {
    await Api.renameNode(where.username, where.currentFullSlug, fullSlug)
  }
  return {
    ok: true, nodeEntry: {
      fullSlug,
      nodeType: "note",
      modTime: (new Date()).toISOString(),
      frontmatter,
    }
  } as const
})

const deleteNoteAction = action(async (where: {
  username: string,
  currentFullSlug: string,
}) => {
  // permanently delete node
  if (where.currentFullSlug.startsWith(".trash/")) {
    await Api.deleteNode(where.username, where.currentFullSlug)
    return { ok: true, newFullSlug: null }
  }
  // move to node trash
  const newFullSlug = await Api.moveNodeToTrash(where.username, where.currentFullSlug)
  return { ok: true, newFullSlug }
})

export default function UpdateNoteModal(props: {
  currentUsername: string,
  currentFullSlug: string,
  currentFrontmatter: Frontmatter,
  onClose: (nodeEntry?: NodeEntry | null) => any,
}) {
  const updateSubmission = useSubmission(updateNoteAction)
  const deleteSubmission = useSubmission(deleteNoteAction)
  const deleteNode = useAction(deleteNoteAction)
  const pending = () => updateSubmission.pending || deleteSubmission.pending
  const currentExtraProperties = () => {
    // NOTE this requires ensuring to always remove registered properties
    const { title: _, accessControl: _2, ...extraProperties } = props.currentFrontmatter
    return extraProperties
  }
  const [fields, setFields] = createStore({
    title: props.currentFrontmatter.title ?? "",
    slug: props.currentFullSlug.split("/").pop()!,
    parentSlug: props.currentFullSlug.split("/").slice(0, -1).join("/"),
    accessControl: props.currentFrontmatter.accessControl,
    extraProperties: JSON.stringify(currentExtraProperties(), null, 2),
  })
  createEffect(() => {
    if (updateSubmission.result === undefined) { return }
    props.onClose(updateSubmission.result.nodeEntry)
    updateSubmission.clear()
  }, { name: "onUpdateSubmission" })
  createEffect(() => {
    if (deleteSubmission.result === undefined) { return }
    const newFullSlug = deleteSubmission.result.newFullSlug
    updateSubmission.clear()
    if (newFullSlug === null) {
      props.onClose(null)
    } else {
      props.onClose({
        fullSlug: newFullSlug,
        nodeType: "note",
        modTime: (new Date()).toISOString(),
        frontmatter: props.currentFrontmatter,
      })
    }
    deleteSubmission.clear()
  }, { name: "onDeleteSubmission" })
  const onDeleteClick = () => {
    deleteNode({
      username: props.currentUsername,
      currentFullSlug: props.currentFullSlug,
    })
  }
  return (
    <BaseModal title="Update Note">
      <form action={updateNoteAction.with({
        username: props.currentUsername,
        currentFullSlug: props.currentFullSlug,
        currentFrontmatter: props.currentFrontmatter,
      })} method="post">
        <NoteFormFields fields={fields} setFields={setFields} />
        <AccessControlEditor
          accessControl={fields.accessControl ?? { publicRead: false }}
          setAccessControl={(accessControl) => {
            setFields({ accessControl })
          }}
        />
        <details class="collapse bg-base-100 border-base-300 border">
          <summary class="collapse-title font-semibold">Extra Properties</summary>
          <div class="collapse-content">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Properties (JSON)</legend>
              <textarea
                class="textarea h-24 w-full"
                name="extraProperties"
                value={fields.extraProperties}
                onInput={(ev) => setFields({ extraProperties: ev.currentTarget.value })}
                placeholder="{  }"
                aria-label="extra properties"
                autocorrect="off"
                autocomplete="off"
                autocapitalize="off"
              ></textarea>
              <p class="label">Extra frontmatter properties, provided in JSON format.</p>
            </fieldset>
          </div>
        </details>
        <Show when={updateSubmission.error}>{err =>
          <AlertBox content={err()} level="error" />
        }</Show>
        <Show when={deleteSubmission.error}>{err =>
          <AlertBox content={err()} level="error" />
        }</Show>
        <div class="modal-action">
          <button
            onClick={onDeleteClick}
            class="btn btn-error btn-outline"
            classList={{ loading: pending() }}
            type="button"
          >
            <Icon name="trash" />
            Delete
          </button>
          <button class="btn btn-primary" classList={{ loading: pending() }} type="submit">
            <Icon name="save" />
            Save
          </button>
          <button
            onclick={() => {
              updateSubmission.clear()
              deleteSubmission.clear()
              props.onClose()
            }}
            class="btn"
            type="button"
          >Cancel</button>
        </div>
      </form>
    </BaseModal>
  )
}
