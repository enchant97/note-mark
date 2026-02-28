import type { NodeEntry } from "~/core/types";
import BaseModal from "./Base";
import { action, useSubmission } from "@solidjs/router";
import Api from "~/core/api";
import Icon from "../Icon";
import { createEffect } from "solid-js";

const createNoteAction = action(async (username: string, currentFullSlug: string, formData: FormData) => {
  const slug = formData.get("slug")?.toString()
  const title = formData.get("title")?.toString()
  if (slug === undefined) {
    throw "invalid form data"
  }
  // TODO validation
  await Api.updateNoteNodeFrontmatter(username, `${currentFullSlug}/${slug}`, {
    title: title,
  })
  return {
    ok: true, data: {
      fullSlug: `${currentFullSlug}/${slug}`,
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
  currentFullSlug: string,
  onClose: (nodeEntry?: NodeEntry) => any,
}) {
  const submission = useSubmission(createNoteAction)
  createEffect(() => {
    if (submission.result === undefined) { return }
    props.onClose(submission.result.data)
  })
  return (
    <BaseModal title="Create Note">
      <form action={createNoteAction.with(props.currentUsername, props.currentFullSlug)} method="post">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Note details</legend>
          <label class="input validator">
            Title
            <input
              name="title"
              type="text"
              placeholder="e.g. My Amazing Note"
            />
          </label>
          <label class="input validator">
            Slug
            <input
              name="slug"
              type="text"
              placeholder="e.g. my-amazing-note"
              required
            />
          </label>
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
