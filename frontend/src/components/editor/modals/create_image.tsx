
import { Component } from "solid-js";
import BaseModal from "../../modals/base";
import { createStore } from "solid-js/store";

type CreateImageModalProps = {
  onClose: (content?: string) => any
}

const CreateImageModal: Component<CreateImageModalProps> = (props) => {
  const [form, setForm] = createStore({
    alt: "",
    src: "",
  })

  return (
    <BaseModal title="Insert Image">
      <form onSubmit={(ev) => {
        ev.preventDefault()
        props.onClose(`![${form.alt}](${form.src})`)
      }}>
        <label class="form-control">
          <span class="label">Alt Text</span>
          <input
            value={form.alt}
            onInput={(ev) => setForm({ alt: ev.currentTarget.value })}
            class="input input-bordered w-full"
            type="text"
            placeholder="e.g. A Grey Cat"
            required
          />
        </label>
        <label class="form-control">
          <span class="label">Source</span>
          <input
            value={form.src}
            onInput={(ev) => setForm({ src: ev.currentTarget.value })}
            class="input input-bordered w-full"
            type="url"
            placeholder="e.g. https://example.com/grey-cat.jpg"
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

export default CreateImageModal;
