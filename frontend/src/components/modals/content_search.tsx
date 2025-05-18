import { For, Suspense, createResource, createSignal } from "solid-js"
import BaseModal from "~/components/modals/base"
import Icon from "~/components/icon"
import { LoadingSpin } from "~/components/loading"

export type Searchable = {
  value: string
}

export type SearchableBook = Searchable & {
  book_title: string
  book_id: string
}

export type SearchableNote = SearchableBook & {
  note_title: string
  note_id: string
}

async function searchSearchables(
  search_term: string,
  books: SearchableBook[],
  notes: SearchableNote[],
  size_limit: number,
): Promise<{ books: SearchableBook[], notes: SearchableNote[] }> {
  let [result_books, result_notes] = await Promise.all([
    new Promise((resolve) => resolve(books.filter(s => s.value.includes(search_term)))),
    new Promise((resolve) => resolve(notes.filter(s => s.value.includes(search_term)))),
  ]);
  return { books: result_books.slice(0, size_limit), notes: result_notes.slice(0, size_limit) }
}

type ContentSearchProps = {
  books: SearchableBook[]
  notes: SearchableNote[]
  onFound: (book_id: string, note_id?: string) => any
  onClose: () => any
}

export default function ContentSearchModal(props: ContentSearchProps) {
  const [searchTerm, setSearchTerm] = createSignal("")
  const [searchResult] = createResource(searchTerm, async (searchTerm) => {
    if (searchTerm === "") { return { books: [], notes: [] } }
    const startTime = performance.now()
    const items = await searchSearchables(searchTerm, props.books, props.notes, 8)
    const endTime = performance.now()
    console.debug(`searching for '${searchTerm}' took ${endTime - startTime}ms`)
    return items
  })

  const booksResult = () => searchResult()?.books || []
  const notesResult = () => searchResult()?.notes || []

  return (
    <BaseModal title="Search">
      <label class="form-control">
        <span class="label"><span class="label-text">Search Term</span></span>
        <input
          value={searchTerm()}
          oninput={(ev) => setSearchTerm(ev.currentTarget.value.toLowerCase())}
          class="input input-sm input-bordered w-full"
          type="text"
          placeholder="e.g. Note Mark"
          required
        />
      </label>
      <ul class="my-4 menu flex-nowrap gap-2 p-2 overflow-y-auto h-40 max-h-40 lg:h-80 lg:max-h-80 bg-base-200 rounded-lg">
        <Suspense fallback={<LoadingSpin />}>
          <For each={booksResult()}>
            {book => <li><button onClick={() => props.onFound(book.book_id)}><Icon name="folder" />{book.book_title}</button></li>}
          </For>
          <For each={notesResult()}>
            {note => <li><button onClick={() => props.onFound(note.book_id, note.note_id)}><Icon name="file" />{note.note_title}</button></li>}
          </For>
        </Suspense>
      </ul>
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
