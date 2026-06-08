import { createResource, createSignal, For, Show, Suspense } from "solid-js";
import BaseModal from "./Base";
import LoadingSpin from "../loading/LoadingSpin";
import Icon from "../Icon";
import AlertBox from "../AlertBox";

interface Item {
  title: string
  href: string
}

function performSearch(sortedItems: Item[], searchTerm: string, maxResults: number = 8): Item[] {
  // TODO improve performance
  return sortedItems.filter((item) => item.title.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, maxResults)
}

export default function ContentSearchModal(props: {
  onClose: (item?: Item) => any,
  sortedItems: Item[],
}) {
  const [searchTerm, setSearchTerm] = createSignal("")
  const [searchResult] = createResource(searchTerm, async (searchTerm) => {
    if (searchTerm === "") { return [] }
    return performSearch(props.sortedItems, searchTerm)
  })
  return (
    <BaseModal title="Content Search">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Search for a note</legend>
        <label class="input validator">
          Term
          <input
            value={searchTerm()}
            oninput={(ev) => setSearchTerm(ev.currentTarget.value)}
            type="text"
            placeholder="e.g. Note Mark"
            required
          />
        </label>
      </fieldset>
      <ul class="my-4 menu w-full flex-nowrap gap-2 p-2 overflow-y-auto h-40 max-h-40 lg:h-80 lg:max-h-80">
        <Suspense fallback={<LoadingSpin />}>
          <For each={searchResult()}>
            {item => (
              <li class="shadow-glass rounded-box bg-base-100">
                <button onClick={() => props.onClose(item)}><Icon name="file" />{item.title}</button>
              </li>
            )}
          </For>
        </Suspense>
      </ul>
      <Show when={searchResult.error}>{err =>
        <AlertBox content={err()} level="error" />
      }</Show>
      <div class="modal-action">
        <button
          onclick={() => props.onClose()}
          class="btn"
          type="button"
        >
          Close
        </button>
      </div>
    </BaseModal>
  )
}
