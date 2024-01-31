import { useParams, A } from '@solidjs/router';
import { Component, For, ParentProps, Show, createResource, createSignal } from 'solid-js';
import Header from './components/header';
import { useApi } from './contexts/ApiProvider';
import { DrawerProvider } from './contexts/DrawerProvider';
import { Book, Note } from './core/types';
import { LoadingRing } from './components/loading';
import { ApiError } from './core/api';
import { SortChoice, SortSelect } from './components/inputs';
import { compare } from './core/helpers';
import Icon from './components/icon';
import { apiErrorIntoToast, useToast } from './contexts/ToastProvider';

function performBookOrNoteSort(rows: Note[] | Book[], method: SortChoice) {
  switch (method) {
    case SortChoice.NAME_ASC:
      return rows.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base', numeric: true }))
    case SortChoice.NAME_DEC:
      return rows.sort((a, b) => b.name.localeCompare(a.name, 'en', { sensitivity: 'base', numeric: true }))
    case SortChoice.UPDATED_ASC:
      return rows.sort((a, b) => compare(a.updatedAt, b.updatedAt))
    case SortChoice.UPDATED_DEC:
      return rows.sort((a, b) => compare(b.updatedAt, a.updatedAt))
    case SortChoice.CREATED_ASC:
      return rows.sort((a, b) => compare(a.createdAt, b.createdAt))
    case SortChoice.CREATED_DEC:
      return rows.sort((a, b) => compare(b.createdAt, a.createdAt))
    default:
      return rows
  }
}

const MainApp: Component<ParentProps> = (props) => {
  const params = useParams()
  const { api } = useApi()
  const { pushToast } = useToast()
  const [sortChoice, setSortChoice] = createSignal(SortChoice.NAME_ASC)

  // NOTE: `|| ""` required as resource source will only compare non-nullish/non-false
  const [booksById, { mutate: mutateBooks }] = createResource(() => params.username || "", async (username) => {
    if (!username) return []
    let result = await api().getBooksBySlug(username)
    if (result instanceof ApiError) {
      pushToast(apiErrorIntoToast(result, `loading books for ${username}`))
      return []
    } else return new Map(result.map((v) => [v.id, v]))
  })

  const books = () => {
    let byId = booksById()
    if (!byId) return []
    return Array.from(byId, (v) => v[1])
  }

  const [notesById, { mutate: mutateNotes }] = createResource(() => [params.username, params.bookSlug], async ([username, bookSlug]) => {
    if (!username || !bookSlug) return []
    let result = await api().getNotesBySlug(username, bookSlug)
    if (result instanceof ApiError) {
      pushToast(apiErrorIntoToast(result, `loading notes for ${username}/${bookSlug}}`))
      return []
    } else return new Map(result.map((v) => [v.id, v]))
  })

  const notes = () => {
    let byId = notesById()
    if (!byId) return []
    return Array.from(byId, (v) => v[1])
  }

  const sortedBooks = () => performBookOrNoteSort([...books()], sortChoice())
  const sortedNotes = () => performBookOrNoteSort([...notes()], sortChoice())

  return (
    <div class="drawer lg:drawer-open">
      <input id="main-drawer" type="checkbox" class="drawer-toggle" />
      <div class="drawer-content min-h-screen pb-8">
        <Header />
        <div class="px-6 mt-2">
          <DrawerProvider
            updateBook={(newBook: Book) => {
              mutateBooks((v) => {
                if (Array.isArray(v)) { v = new Map() }
                v?.set(newBook.id, newBook)
                return new Map(v)
              })
            }}
            updateNote={(newNote: Note) => {
              mutateNotes((v) => {
                if (Array.isArray(v)) { v = new Map() }
                v?.set(newNote.id, newNote)
                return new Map(v)
              })
            }}
            deleteBook={(id) => {
              mutateBooks((v) => {
                if (!Array.isArray(v)) {
                  v?.delete(id)
                }
                return new Map(v)
              })
            }}
            deleteNote={(id) => {
              mutateNotes((v) => {
                if (!Array.isArray(v)) {
                  v?.delete(id)
                }
                return new Map(v)
              })
            }}
          >
            {props.children}
          </DrawerProvider>
        </div>
      </div>
      <div class="drawer-side z-40">
        <label for="main-drawer" class="drawer-overlay"></label>
        <menu class="menu menu-sm gap-2 p-4 w-80 bg-base-300-blur text-base-content h-full">
          <li><label aria-label="Sort Mode">
            <Icon name="align-left" />
            <SortSelect onChange={setSortChoice} selected={sortChoice()} />
          </label></li>
          <li class="menu-title">NOTEBOOKS</li>
          <ul class="bg-base-100 flex-1 overflow-auto rounded-lg">
            <Show when={!booksById.loading} fallback={<LoadingRing />}>
              <For each={sortedBooks()}>
                {(book) => <li>
                  <A
                    href={`/${params.username}/${book.slug}`}
                    end={true}
                  >
                    <Icon name="folder" size={14} />
                    {book.name}
                  </A>
                  <Show when={book.slug === params.bookSlug && !notesById.loading}>
                    <ul>
                      <For each={sortedNotes()}>
                        {(note) => <li>
                          <A
                            href={`/${params.username}/${params.bookSlug}/${note.slug}`}
                            end={true}
                          >
                            <Icon name="file" size={14} />
                            {note.name}
                          </A></li>}
                      </For>
                    </ul>
                  </Show>
                </li>}
              </For>
            </Show>
          </ul>
          <li>
            <a
              href="https://github.com/enchant97/note-mark"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm block leading-relaxed"
            >
              Powered By
              <span class="font-bold"> Note Mark</span>
              <br />
              Licensed Under AGPL-3.0
            </a>
          </li>
        </menu>
      </div>
    </div >
  );
}

export default MainApp;
