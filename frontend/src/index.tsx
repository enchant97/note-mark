/* @refresh reload */
import './index.css';
import { render } from 'solid-js/web';

import App from './App';
import { ApiProvider } from './contexts/ApiProvider';
import { Router } from '@solidjs/router';
import { CurrentUserProvider } from './contexts/CurrentUserProvider';
import { Modal, ModalProvider } from './contexts/ModalProvider';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

render(() => <>
  <Router>
    <ModalProvider>
      <ApiProvider>
        <CurrentUserProvider>
          <Modal />
          <App />
        </CurrentUserProvider>
      </ApiProvider>
    </ModalProvider>
  </Router>
</>, root!);
