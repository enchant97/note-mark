import { A } from '@solidjs/router';
import { Component } from 'solid-js';
import { useApi } from '../contexts/ApiProvider';
import { useCurrentUser } from '../contexts/CurrentUserProvider';
import { useModal } from '../contexts/ModalProvider';
import UserSearchModal from '../components/modals/user_search';
import RecentNotes from '../components/recent_notes';
import Header from '../components/header';
import Footer from '../components/footer';

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
    <div class="min-h-screen">
      <Header />
      <div class="bg-base-200 p-6 mx-6">
        <div class="card w-full max-w-md mx-auto bg-base-100">
          <div class="card-body text-center">
            <img class="mb-2 mx-auto w-36" src="/icon.svg" alt="Note Mark Icon" />
            <h1 class="text-5xl font-bold">Note Mark</h1>
            <p class="py-6">Lighting Fast & Minimal Markdown Note Taking App.</p>
            <div class="join justify-center">
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
            <div class="max-w-lg mx-auto">
              <div class="mx-4 my-4">
                <h2 class="text-lg font-bold text-center">Recent Notes</h2>
                <RecentNotes />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
