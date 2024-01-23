import { A } from '@solidjs/router';
import { Component } from 'solid-js';
import { useApi } from '../contexts/ApiProvider';
import { useCurrentUser } from '../contexts/CurrentUserProvider';
import { useModal } from '../contexts/ModalProvider';
import UserSearchModal from '../components/modals/user_search';
import RecentNotes from '../components/recent_notes';

const Home: Component = () => {
  const { apiDetails } = useApi()
  const { setModal, clearModal } = useModal()
  const { user } = useCurrentUser()

  const openUserSearchModal = () => {
    setModal({
      component: UserSearchModal,
      props: {
        onClose: () => clearModal(),
      },
    })
  }

  return (
    <div class="bg-base-200 py-6">
      <div class="text-center">
        <div class="max-w-md mx-auto">
          <img class="mb-4 mx-auto max-w-xs" src="/icon.svg" alt="Note Mark Icon" />
          <h1 class="text-5xl font-bold">Note Mark</h1>
          <p class="py-6">Lighting Fast & Minimal Markdown Note Taking App.</p>
          <div class="join">
            {!apiDetails().authToken && <A href="/login" class="btn join-item btn-outline">Login</A>}
            {user() && <A class="btn join-item btn-outline" href={`/${user()?.username}`}>My Notes</A>}
            <button
              onclick={() => openUserSearchModal()}
              class="btn join-item btn-outline"
              type="button"
            >
              Find User
            </button>
          </div>
        </div>
      </div>
      <div class="mx-4 my-4 p-2 bg-base-100 rounded">
        <h2 class="text-lg font-bold text-center">Recent Notes</h2>
        <RecentNotes />
      </div>
    </div>
  );
};

export default Home;
