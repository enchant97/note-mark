import { A, useParams } from "@solidjs/router";
import RecentNotes from "../../components/recent_notes";
import UserSearchModal from "../../components/modals/user_search";
import { useModal } from "../../contexts/ModalProvider";
import { useCurrentUser } from "../../contexts/CurrentUserProvider";
import { Show } from "solid-js";

const User = () => {
  const params = useParams()
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
    <div class="bg-base-200 py-6 flex flex-col gap-4">
      <h1 class="text-4xl font-bold text-center">{params.username}'s Area</h1>
      <div class="max-w-md mx-auto text-center">
        <div class="join">
          <Show
            when={user() !== undefined} fallback={
              <A class="btn join-item btn-outline" href="/login">Login</A>
            }>
            <A
              class="btn join-item btn-outline"
              activeClass="btn-disabled"
              href={`/${user()?.username}`}
            >My Notes</A>
          </Show>
          <button
            onclick={() => openUserSearchModal()}
            class="btn join-item btn-outline"
            type="button"
          >
            Find User
          </button>
        </div>
      </div>
      <div class="mx-4 p-2 bg-base-100 rounded">
        <h2 class="text-lg font-bold text-center">Recent Notes</h2>
        <RecentNotes />
      </div>
    </div>
  )
}

export default User;
