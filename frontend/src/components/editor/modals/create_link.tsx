import { Component } from "solid-js";
import BaseModal from "../../modals/base";
import { createStore } from "solid-js/store";

type CreateLinkModalProps = {
  onClose: (content?: string) => any
}

const CreateLinkModal: Component<CreateLinkModalProps> = (props) => {
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

export default CreateLinkModal;
