import { A, Navigate, useNavigate } from '@solidjs/router';
import { Component, Show } from 'solid-js';
import { useApi } from '~/contexts/ApiProvider';
import { useModal } from '~/contexts/ModalProvider';
import UserSearchModal from '~/components/modals/user_search';
import RecentNotes from '~/components/recent_notes';
import Header from '~/components/header';
import Footer from '~/components/footer';
import Icon from '~/components/icon';
import { useAuth } from '~/contexts/AuthProvider';

const Home: Component = () => {
  const navigate = useNavigate()
  const { apiInfo, userInfo } = useApi()
  const { accessToken, setAuthStore } = useAuth()
  const { setModal, clearModal } = useModal()

  const openUserSearchModal = () => {
    setModal({
      component: UserSearchModal,
      props: {
        onClose: () => clearModal(),
      },
    })
  }

  return (
    <Show when={userInfo() === undefined} fallback={<Navigate href={`/${userInfo()?.username}`} />}>
      <div class="min-h-screen">
        <Header disableDrawerToggle={true} />
        <div class="bg-base-200 p-6 mx-6">
          <div class="card w-full max-w-md mx-auto bg-base-100">
            <div class="card-body text-center">
              <img class="mb-2 mx-auto w-36" src="/icon.svg" alt="Note Mark Icon" />
              <h1 class="text-5xl font-bold">Note Mark</h1>
              <p class="py-6">Lighting Fast & Minimal Markdown Note Taking App.</p>
              <div class="justify-center" classList={{ 'join': apiInfo()?.enableAnonymousUserSearch }}>
                <Show when={accessToken()} fallback={
                  <A
                    class="join-item btn btn-outline"
                    href="/login"
                  >Login</A>
                }>
                  <button
                    class="join-item btn btn-outline" onclick={() => {
                      setAuthStore(null)
                      navigate("/login")
                    }}>Re-Login</button>
                </Show>
                {userInfo() && <A class="btn join-item btn-outline" href={`/${userInfo()?.username}`}>My Notes</A>}
                {apiInfo()?.enableAnonymousUserSearch && <button
                  onclick={() => openUserSearchModal()}
                  class="btn join-item btn-outline"
                  type="button"
                >
                  <Icon name="users" />
                  Find User
                </button>}
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
    </Show>
  );
};

export default Home;
