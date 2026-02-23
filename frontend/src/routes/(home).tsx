import { A, Navigate } from '@solidjs/router';
import { Show } from 'solid-js';
import { useModal } from '~/contexts/ModalProvider';
import UserSearchModal from '~/components/modals/UserSearch';
import Header from '~/components/Header';
import Icon from '~/components/Icon';
import { useSession } from '~/contexts/SessionProvider';

export default function Home() {
  const { apiInfo, userInfo } = useSession()
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
    <Show when={(userInfo() ?? null) === null} fallback={<Navigate href={`/${userInfo()?.preferred_username}`} />}>
      <div class="min-h-screen">
        <Header disableDrawerToggle={true} />
        <div class="p-6 mx-6">
          <div class="flex w-full max-w-md mx-auto">
            <div class="card-body text-center">
              <img class="mb-2 mx-auto w-36" src="/icon.svg" alt="Note Mark Icon" />
              <h1 class="text-5xl font-bold">Note Mark</h1>
              <p class="py-6">Lighting Fast & Minimal Markdown Note Taking App.</p>
              <div class="justify-center" classList={{ 'join': apiInfo()?.enableAnonymousUserSearch }}>
                <A
                  class="join-item btn"
                  href="/login"
                >Login</A>
                {userInfo() && <A class="btn join-item btn-outline" href={`/${userInfo()?.preferred_username}`}>My Notes</A>}
                {apiInfo()?.enableAnonymousUserSearch && <button
                  onclick={() => openUserSearchModal()}
                  class="btn join-item"
                  type="button"
                >
                  <Icon name="users" />
                  Find User
                </button>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}
