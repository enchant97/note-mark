import { A } from '@solidjs/router';
import { Component } from 'solid-js';
import { useApi } from '../contexts/ApiProvider';
import { useCurrentUser } from '../contexts/CurrentUserProvider';
import { useModal } from '../contexts/ModalProvider';
import UserSearchModal from '../components/modals/user_search';

const Index: Component = () => {
  const { apiDetails } = useApi()
  const { setModal, clearModal } = useModal()
  const user = useCurrentUser()

  const openUserSearchModal = () => {
    setModal({
      component: UserSearchModal,
      props: {
        onClose: () => clearModal(),
      },
    })
  }

  return (
    <div class="hero bg-base-200 pt-6 pb-6">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <img class="mb-4 mx-auto max-w-xs" src="/icon.svg" alt="Note Mark Icon" />
          <h1 class="text-5xl font-bold">Note Mark</h1>
          <p class="py-6">Lighting Fast & Minimal Markdown Note Taking App.</p>
          <div class="btn-group">
            {!apiDetails().authToken && <A href="/login" class="btn btn-outline">Login</A>}
            {user() && <A class="btn btn-outline" href={`/${user()?.username}`}>My Notes</A>}
            <button
              onclick={() => openUserSearchModal()}
              class="btn btn-outline"
              type="button"
            >
              Find User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
