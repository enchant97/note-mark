import { action, useSubmission } from "@solidjs/router";
import BaseModal from "./Base";
import { Frontmatter, NodeEntry } from "~/core/types";
import Icon from "../Icon";
import { createEffect } from "solid-js";
import { createStore } from "solid-js/store";
import NoteFormFields from "../input/NoteFormFields";

const updateNoteAction = action(async (where: {
  username: string,
  currentFullSlug: string,
  currentFrontmatter: Frontmatter,
}, formData: FormData) => {
  // TODO
  return { ok: true }
})

const deleteNoteAction = action(async (where: {
  username: string,
  currentFullSlug: string,
}, formData: FormData) => {
  // TODO
  return { ok: true }
})

export default function UpdateNoteModal(props: {
  currentUsername: string,
  currentFullSlug: string,
  currentFrontmatter: Frontmatter,
  onClose: (nodeEntry?: NodeEntry) => any,
}) {
  const updateSubmission = useSubmission(updateNoteAction)
  const deleteSubmission = useSubmission(deleteNoteAction)
  const pending = () => updateSubmission.pending || deleteSubmission.pending
  const currentExtraProperties = () => {
    // NOTE this requires ensuring to always remove registered properties
    const { title: _, ...extraProperties } = props.currentFrontmatter
    return extraProperties
  }
  const [fields, setFields] = createStore({
    title: props.currentFrontmatter.title ?? "",
    slug: "",
    parentSlug: props.currentFullSlug ?? "",
    extraProperties: JSON.stringify(currentExtraProperties()),
  })
  createEffect(() => {
    if (updateSubmission.result === undefined) { return }
    props.onClose(updateSubmission.result.data)
  })
  createEffect(() => {
    if (deleteSubmission.result === undefined) { return }
    props.onClose(deleteSubmission.result.data)
  })
  return (
    <BaseModal title="Update Note">
      <form action={updateNoteAction.with({
        username: props.currentUsername,
        currentFullSlug: props.currentFullSlug,
        currentFrontmatter: props.currentFrontmatter,
      })} method="post">
      </form>
      <NoteFormFields fields={fields} setFields={setFields} />
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
            ></textarea>
            <p class="label">Extra frontmatter properties, provided in JSON format.</p>
          </fieldset>
        </div>
      </details>
      <div class="modal-action">
        <button class="btn btn-error btn-outline" classList={{ loading: pending() }} type="button">
          <Icon name="trash" />
          Delete
        </button>
        <button class="btn btn-primary" classList={{ loading: pending() }} type="submit">
          <Icon name="save" />
          Save
        </button>
        <button onclick={() => props.onClose()} class="btn" type="button">Cancel</button>
      </div>
    </BaseModal>
  )
}
