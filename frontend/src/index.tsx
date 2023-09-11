/* @refresh reload */
import './index.css';
import { Suspense, render } from 'solid-js/web';

import { ApiProvider } from './contexts/ApiProvider';
import { Router } from '@solidjs/router';
import { CurrentUserProvider } from './contexts/CurrentUserProvider';
import { Modal, ModalProvider } from './contexts/ModalProvider';
import { ToastProvider, Toasts } from './contexts/ToastProvider';
import { LoadingScreen } from './components/loading';
import { lazy } from 'solid-js';

const App = lazy(() => import("./App"))

import init from 'renderer';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

init().then(() => console.debug("wasm backend loaded"))

render(() => <>
  <Router>
    <ToastProvider>
      <Toasts />
      <ModalProvider>
        <ApiProvider>
          <CurrentUserProvider>
            <Modal />
            <Suspense fallback={<LoadingScreen message="Loading App" />}>
              <App />
            </Suspense>
          </CurrentUserProvider>
        </ApiProvider>
      </ModalProvider>
    </ToastProvider>
  </Router>
</>, root!);
