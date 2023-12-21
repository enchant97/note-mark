import { A } from '@solidjs/router';
import { Component, For, Suspense, createResource } from 'solid-js';
import { useApi } from '../contexts/ApiProvider';
import { useCurrentUser } from '../contexts/CurrentUserProvider';
import { useModal } from '../contexts/ModalProvider';
import UserSearchModal from '../components/modals/user_search';
import { ApiError } from '../core/api';
import { LoadingSpin } from '../components/loading';

const Index: Component = () => {
  const { api, apiDetails } = useApi()
  const { setModal, clearModal } = useModal()
  const { user } = useCurrentUser()

  const [recentNotes] = createResource(api, async (api) => {
    let recentNotes = await api.getNotesRecents()
    if (recentNotes instanceof ApiError) {
      return []
    } else {
      return recentNotes
    }
  })

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
        <Suspense fallback={<LoadingSpin />}>
          <ul class="flex gap-2 flex-col items-center mt-2">
            <For each={recentNotes()}>
              {row => <li><A class="btn btn-wide" href={`/${row.slug}`}>{row.value.name}</A></li>}
            </For>
          </ul>
        </Suspense>
      </div>
    </div>
  );
};

export default Index;
