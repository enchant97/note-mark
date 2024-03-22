import { useParams, A } from '@solidjs/router';
import { Component, For, ParentProps, Show, createResource, createSignal } from 'solid-js';
import Header from './components/header';
import { useApi } from './contexts/ApiProvider';
import { DrawerProvider } from './contexts/DrawerProvider';
import { Book, Note, User } from './core/types';
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

type MappedBook = Book & {
  notes: Map<string, Note>
}

type MappedUser = User & {
  books: Map<string, MappedBook>
}

const MainApp: Component<ParentProps> = (props) => {
  const params = useParams()
  const { api } = useApi()
  const { pushToast } = useToast()
  const [sortChoice, setSortChoice] = createSignal(SortChoice.NAME_ASC)

  const [userData, { mutate: mutateUserData }] = createResource(() => params.username, async (username) => {
    let result = await api().getUserByUsername(username, "notes")
    if (result instanceof ApiError) {
      pushToast(apiErrorIntoToast(result, `loading data for ${username}`))
    } else {
      let data = new Map<string, MappedUser>(Object.entries(result))
      let books = new Map(Object.entries(result.books!).map((v) => {
        let book = new Map(Object.entries(v[1]))
        book.set("notes", new Map(v[1].notes?.map((v) => [v.id, v])) || new Map())
        return [v[1].id, book]
      }))
      data.set("books", books)
      return data
    }
  })

  const currentUser = () => {
    let user = userData()
    if (user !== undefined) {
      user = new Map(user)
      user.delete("books")
      return Object.fromEntries(user.entries())
    }
  }

  const [currentBook] = createResource(() => [params.username, params.bookSlug], async ([username, bookSlug]) => {
    if (!bookSlug) { return }
    let result = await api().getBookBySlug(username, bookSlug)
    if (result instanceof ApiError) {
      pushToast(apiErrorIntoToast(result, "fetching lookup for book"))
    } else { return result }
  })

  const [currentNote] = createResource(() => [params.username, params.bookSlug, params.noteSlug], async ([username, bookSlug, noteSlug]) => {
    if (!noteSlug) { return }
    let result = await api().getNoteBySlug(username, bookSlug, noteSlug)
    if (result instanceof ApiError) {
      pushToast(apiErrorIntoToast(result, "fetching lookup for note"))
    } else { return result }
  })

  const currentBookId = () => currentBook()?.id

  const books = () => {
    let b: Map<string, MappedBook> = userData()?.get("books")
    if (!b) return []
    return Array.from<Book>(b.values().map(v => Object.fromEntries(v)))
  }

  const notes = () => {
    let n: Map<string, MappedBook> | undefined = userData()?.get("books")?.get(currentBookId())?.get("notes")
    if (!n) { return [] }
    return Array.from<Note>(n.values())
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
            currentUser={currentUser}
            currentBook={currentBook}
            currentNote={currentNote}
            updateBook={(newBook: Book) => {
              mutateUserData((v) => {
                let notes = v.get("books")?.get(newBook.id)?.get("notes")
                if (notes === undefined) {
                  v.get("books").set(newBook.id, new Map(Object.entries({ "notes": new Map(), ...newBook })))
                } else {
                  v.get("books").set(newBook.id, new Map(Object.entries({ ...newBook, notes })))
                }
                return new Map(v)
              })
            }}
            updateNote={(newNote: Note) => {
              mutateUserData((v) => {
                v.get("books").get(currentBookId())?.get("notes").delete(newNote.id)
                v.get("books").get(newNote.bookId)?.get("notes").set(newNote.id, newNote)
                return new Map(v)
              })
            }}
            deleteBook={(id) => {
              mutateUserData((v) => {
                v.get("books").delete(id)
                return new Map(v)
              })
            }}
            deleteNote={(id) => {
              mutateUserData((v) => {
                v.get("books").get(currentBookId())?.get("notes").delete(id)
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
            <Show when={!userData.loading} fallback={<LoadingRing />}>
              <For each={sortedBooks()}>
                {(book) => <li>
                  <A
                    href={`/${params.username}/${book.slug}`}
                    end={true}
                  >
                    <Icon name="folder" size={14} />
                    {book.name}
                  </A>
                  <Show when={book.slug === params.bookSlug}>
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
