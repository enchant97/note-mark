import BaseModal from "~/components/modals/Base";
import { createStore } from "solid-js/store";

export default function CreateLinkModal(props: { onClose: (content?: string) => any }) {
  const [form, setForm] = createStore({
    title: "",
    url: "",
  })

  return (
    <BaseModal title="Insert Link">
      <form onSubmit={(ev) => {
        ev.preventDefault()
        props.onClose(`[${form.title}](${form.url})`)
      }}>
        <label class="form-control">
          <span class="label">Title</span>
          <input
            value={form.title}
            onInput={(ev) => setForm({ title: ev.currentTarget.value })}
            class="input input-bordered w-full"
            type="text"
            placeholder="e.g. My Link"
            required
          />
        </label>
        <label class="form-control">
          <span class="label">URL</span>
          <input
            value={form.url}
            onInput={(ev) => setForm({ url: ev.currentTarget.value })}
            class="input input-bordered w-full"
            type="url"
            placeholder="e.g. https://example.com"
            required
          />
        </label>
        <div class="modal-action">
          <button class="btn btn-primary" type="submit">Insert</button>
          <button onclick={() => props.onClose()} class="btn" type="button">Cancel</button>
        </div>
      </form>
    </BaseModal>
  )
}
