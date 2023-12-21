
import { Component } from "solid-js";
import BaseModal from "../../modals/base";
import { createStore } from "solid-js/store";

type CreateTableModalProps = {
  onClose: (content?: string) => any
}

const CreateTableModal: Component<CreateTableModalProps> = (props) => {
  const [form, setForm] = createStore({
    rows: 0,
    columns: 0,
  })

  function makeRow(columns: number, innerContent: string) {
    let content = ""
    for (let i = 0; i < columns; i++) {
      content += "|" + innerContent
    }
    content += "|\n"
    return content
  }

  return (
    <BaseModal title="Insert Table">
      <form onSubmit={(ev) => {
        ev.preventDefault()
        let content = ""
        content += makeRow(form.columns, "   ")
        content += makeRow(form.columns, ":--")
        for (let i = 0; i < form.rows; i++) {
          content += makeRow(form.columns, "   ")
        }
        props.onClose(content)
      }}>
        <label class="form-control">
          <span class="label">Rows</span>
          <input
            value={form.rows}
            onInput={(ev) => setForm({ rows: Number.parseInt(ev.currentTarget.value) || 0 })}
            class="input input-bordered w-full"
            type="number"
            min={1}
            required
          />
        </label>
        <label class="form-control">
          <span class="label">Columns</span>
          <input
            value={form.columns}
            onInput={(ev) => setForm({ columns: Number.parseInt(ev.currentTarget.value) || 0 })}
            class="input input-bordered w-full"
            type="number"
            min={1}
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

export default CreateTableModal;
