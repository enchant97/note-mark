import { Routes, Route, Outlet, useParams, A } from '@solidjs/router';
import { Component, For, Show, createResource, createSignal, lazy } from 'solid-js';
import Header from './components/header';
import { useApi } from './contexts/ApiProvider';
import ProtectedRoute from './components/protected_route';
import { DrawerProvider } from './contexts/DrawerProvider';
import { Book, Note } from './core/types';
import { LoadingBar, LoadingSpin } from './components/loading';
import { apiErrorIntoToast, useToast } from './contexts/ToastProvider';
import { ApiError } from './core/api';
import PreLogin from './pages/pre-login';
import { SortChoice, SortSelect } from './components/inputs';
import { compare } from './core/helpers';

const Index = lazy(() => import("./pages/index"));
const Login = lazy(() => import("./pages/login"));
const Signup = lazy(() => import("./pages/signup"));
const Logout = lazy(() => import("./pages/logout"));
const Profile = lazy(() => import("./pages/profile"));
const Shelf = lazy(() => import("./pages/shelf"));



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

const MainApp: Component = () => {
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
      <div class="drawer-content pb-8">
        <Header />
        <div class="px-6">
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
            <Show when={!booksById.loading && !notesById.loading} fallback={<LoadingBar />}>
              <Outlet />
            </Show>
          </DrawerProvider>
        </div>
      </div>
      <div class="drawer-side z-40">
        <label for="main-drawer" class="drawer-overlay"></label>
        <ul class="menu menu-sm gap-4 p-4 w-80 bg-base-300 text-base-content h-full">
          <li><SortSelect onChange={setSortChoice} selected={sortChoice()} /></li>
          <li class="menu-title"><span>NOTEBOOKS</span></li>
          <ul class="overflow-auto bg-base-100 flex-1 w-full rounded-lg">
            <Show when={!booksById.loading} fallback={<LoadingSpin />}>
              <For each={sortedBooks()}>
                {(book) => <li>
                  <A
                    href={`/${params.username}/${book.slug}`}
                    class="whitespace-nowrap"
                    end={true}
                  >{book.name}
                  </A></li>}
              </For>
            </Show>
          </ul>
          <li class="menu-title"><span>NOTES</span></li>
          <ul class="overflow-auto bg-base-100 flex-1 w-full rounded-lg">
            <Show when={!notesById.loading} fallback={<LoadingSpin />}>
              <For each={sortedNotes()}>
                {(note) => <li>
                  <A
                    href={`/${params.username}/${params.bookSlug}/${note.slug}`}
                    class="whitespace-nowrap"
                    end={true}
                  >{note.name}
                  </A></li>}
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
              Licenced Under AGPL-3.0
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

const App: Component = () => {
  const { apiDetails } = useApi()

  const hasAuth = () => {
    return apiDetails().authToken !== undefined
  }

  const hasNoAuth = () => {
    return !hasAuth()
  }

  return (
    <Routes>
      <Route path="/pre-login" component={PreLogin} />
      <ProtectedRoute path="/login" redirectPath="/" condition={() => hasNoAuth()} component={Login} />
      <ProtectedRoute path="/signup" redirectPath="/login" condition={() => hasNoAuth() && apiDetails().info?.allowSignup !== false} component={Signup} />
      <ProtectedRoute path="/logout" redirectPath="/" condition={hasAuth} component={Logout} />
      <ProtectedRoute path="/" redirectPath="/pre-login" condition={() => apiDetails().info !== undefined} component={MainApp}>
        <Route path="/" component={Index} />
        <ProtectedRoute path="/profile" redirectPath="/" condition={hasAuth} component={Profile} />
        <Route path="/:username/:bookSlug?/:noteSlug?" component={Shelf} />
      </ProtectedRoute>
    </Routes>
  );
};

export default App;
