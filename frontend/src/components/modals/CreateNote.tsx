import type { NodeEntry } from "~/core/types";
import BaseModal from "./Base";
import { action, useSubmission } from "@solidjs/router";
import Api from "~/core/api";
import Icon from "../Icon";
import { createEffect } from "solid-js";
import { createStore } from "solid-js/store";
import { toPathSlug, toSlug, toSlugWithSuffix } from "~/core/helpers";

const createNoteAction = action(async (where: { username: string }, formData: FormData) => {
  const parentSlug = formData.get("parentSlug")?.toString()
  const slug = formData.get("slug")?.toString()
  const title = formData.get("title")?.toString()
  if (slug === undefined || parentSlug === undefined) {
    throw "invalid form data"
  }
  const fullSlug = parentSlug
    ? `${parentSlug}/${slug}`
    : slug
  await Api.updateNoteNodeFrontmatter(where.username, fullSlug, {
    title: title,
  })
  return {
    ok: true, data: {
      fullSlug,
      nodeType: "note",
      modTime: (new Date()).toISOString(),
      frontmatter: {
        title,
      },
    }
  } as const
})

export default function CreateNoteModal(props: {
  currentUsername: string,
  currentFullSlug?: string,
  onClose: (nodeEntry?: NodeEntry) => any,
}) {
  const submission = useSubmission(createNoteAction)
  const [fields, setFields] = createStore({
    title: "",
    slug: "",
    parentSlug: props.currentFullSlug ?? "",
  })
  createEffect(() => {
    if (submission.result === undefined) { return }
    props.onClose(submission.result.data)
  })
  return (
    <BaseModal title="Create Note">
      <form action={createNoteAction.with({
        username: props.currentUsername,
      })} method="post">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Title</legend>
          <input
            class="input validator"
            value={fields.title}
            onInput={(ev) => setFields({
              title: ev.currentTarget.value,
              slug: toSlugWithSuffix(ev.currentTarget.value),
            })}
            name="title"
            type="text"
            placeholder="e.g. My Amazing Note"
            aria-label="title"
            required
          />
          <p class="label">The title of the note, human friendly.</p>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Slug</legend>
          <input
            class="input validator"
            value={fields.slug}
            onInput={(ev) => setFields({
              slug: toSlug(ev.currentTarget.value),
            })}
            name="slug"
            type="text"
            placeholder="e.g. my-amazing-note"
            aria-label="slug"
            required
          />
          <p class="label">URL friendly name, will auto-generate based on title.</p>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Path</legend>
          <span class="input validator">
            <input
              value={fields.parentSlug}
              onInput={(ev) => setFields({
                parentSlug: toPathSlug(ev.currentTarget.value),
              })}
              name="parentSlug"
              type="text"
              placeholder="e.g. some/path"
              aria-label="path"
            />
            <span class="label">{`/${fields.slug}`}</span>
          </span>
          <p class="label">Where note will be created, leave blank for placing at top level.</p>
        </fieldset>
        <div class="modal-action">
          <button class="btn btn-primary" classList={{ loading: submission.pending }} type="submit">
            <Icon name="file-plus" />
            Create
          </button>
          <button onclick={() => props.onClose()} class="btn" type="button">Cancel</button>
        </div>
      </form>
    </BaseModal>
  )
}
