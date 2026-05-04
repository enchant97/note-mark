import type { NodeEntry } from "~/core/types";
import BaseModal from "./Base";
import { action, useSubmission } from "@solidjs/router";
import Api from "~/core/api";
import Icon from "../Icon";
import { createEffect, Show } from "solid-js";
import { createStore } from "solid-js/store";
import NoteFormFields from "../input/NoteFormFields";
import AlertBox from "../AlertBox";

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
        <NoteFormFields fields={fields} setFields={setFields} />
        <Show when={submission.error}>{err =>
          <AlertBox content={err()} level="error" />
        }</Show>
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
