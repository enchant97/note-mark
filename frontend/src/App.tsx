import { Routes, Route, Outlet, useParams, A } from '@solidjs/router';
import { Component, For, createResource, lazy } from 'solid-js';
import Header from './components/header';
import { useApi } from './contexts/ApiProvider';
import ProtectedRoute from './components/protected_route';

const Index = lazy(() => import("./pages/index"));
const Login = lazy(() => import("./pages/login"));
const Logout = lazy(() => import("./pages/logout"));
const Shelf = lazy(() => import("./pages/shelf"));

const MainApp: Component = () => {
  const params = useParams()
  const { api } = useApi()

  const [books] = createResource(params.username, async (username) => {
    if (username === undefined) return []
    // TODO handle errors
    let result = await api().getBooksBySlug(username)
    return result.unwrap()
  })

  const [notes] = createResource(() => [params.username, params.bookSlug], async ([username, bookSlug]) => {
    if (username === undefined || bookSlug === undefined) return []
    // TODO handle errors
    let result = await api().getNotesBySlug(username, bookSlug)
    return result.unwrap()
  })

  return (
    <div class="drawer drawer-mobile">
      <input id="main-drawer" type="checkbox" class="drawer-toggle" />
      <div class="drawer-content">
        <Header />
        <Outlet />
      </div>
      <div class="drawer-side">
        <label for="main-drawer" class="drawer-overlay"></label>
        <ul class="menu menu-compact gap-4 p-4 w-80 bg-base-300 text-base-content max-h-screen">
          <li><button class="btn btn-outline">User Search</button></li>
          <li>NOTEBOOKS</li>
          <ul class="overflow-auto bg-base-100 flex-1 w-full">
            <For each={books()}>
              {(book) => <li>
                <A
                  href={`/${params.username}/${book.slug}`}
                  class="whitespace-nowrap"
                >{book.name}
                </A></li>}
            </For>
          </ul>
          <li>NOTES</li>
          <ul class="overflow-auto bg-base-100 flex-1 w-full">
            <For each={notes()}>
              {(note) => <li>
                <A
                  href={`/${params.username}/${params.bookSlug}/${note.slug}`}
                  class="whitespace-nowrap"
                >{note.name}
                </A></li>}
            </For>
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
              <span class="text-error"> (ALPHA)</span>
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
      <ProtectedRoute path="/login" redirectPath="/" condition={hasNoAuth} component={Login} />
      <ProtectedRoute path="/logout" redirectPath="/" condition={hasAuth} component={Logout} />
      <Route path="/" component={MainApp}>
        <Route path="/" component={Index} />
        <Route path="/:username/:bookSlug?/:noteSlug?" component={Shelf} />
      </Route>
    </Routes>
  );
};

export default App;
