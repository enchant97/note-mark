import { A, Navigate, useNavigate } from '@solidjs/router';
import { Component, Show } from 'solid-js';
import { useModal } from '~/contexts/ModalProvider';
import UserSearchModal from '~/components/modals/user_search';
import RecentNotes from '~/components/recent_notes';
import Header from '~/components/header';
import Icon from '~/components/icon';
import { useSession } from '~/contexts/SessionProvider';
import Api from '~/core/api';

const Home: Component = () => {
  const navigate = useNavigate()
  const { isAuthenticated, apiInfo, userInfo, setIsAuthenticated } = useSession()
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
        <div class="p-6 mx-6">
          <div class="flex w-full max-w-md mx-auto">
            <div class="card-body text-center">
              <img class="mb-2 mx-auto w-36" src="/icon.svg" alt="Note Mark Icon" />
              <h1 class="text-5xl font-bold">Note Mark</h1>
              <p class="py-6">Lighting Fast & Minimal Markdown Note Taking App.</p>
              <div class="justify-center" classList={{ 'join': apiInfo()?.enableAnonymousUserSearch }}>
                <Show when={isAuthenticated()} fallback={
                  <A
                    class="join-item btn"
                    href="/login"
                  >Login</A>
                }>
                  <button
                    class="join-item btn" onclick={async () => {
                      await Api.getLogout()
                      setIsAuthenticated(false)
                      navigate("/login")
                    }}>Re-Login</button>
                </Show>
                {userInfo() && <A class="btn join-item btn-outline" href={`/${userInfo()?.username}`}>My Notes</A>}
                {apiInfo()?.enableAnonymousUserSearch && <button
                  onclick={() => openUserSearchModal()}
                  class="btn join-item"
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
      </div>
    </Show>
  );
};

export default Home;
