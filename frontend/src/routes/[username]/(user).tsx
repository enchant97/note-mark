import { A, useParams } from "@solidjs/router";
import { Show } from "solid-js";
import UserSearchModal from "~/components/modals/UserSearch";
import { useModal } from "~/contexts/ModalProvider";
import Icon from "~/components/Icon";
import { useSession } from "~/contexts/SessionProvider";

export default function User() {
  const params = useParams<{
    username: string,
  }>()
  const { setModal, clearModal } = useModal()
  const { isAuthenticated, userInfo } = useSession()

  const openUserSearchModal = () => {
    setModal({
      component: UserSearchModal,
      props: {
        onClose: () => clearModal(),
      },
    })
  }

  return (
    <div class="py-6 mt-6 flex flex-col gap-4 max-w-md mx-auto text-center">
      <h1 class="text-4xl font-bold text-center">{params.username}'s Area</h1>
      <div class="text-center">
        <div class="join">
          <Show
            when={isAuthenticated()} fallback={
              <A
                class="join-item btn"
                href="/auth/login"
              >Login</A>
            }>
            <A
              class="btn join-item"
              classList={{ "btn-disabled": userInfo()?.preferred_username === params.username }}
              href={`/${userInfo()?.preferred_username}`}
            >My Notes</A>
          </Show>
          <button
            onclick={() => openUserSearchModal()}
            class="btn join-item"
            type="button"
          >
            <Icon name="users" />
            Find User
          </button>
        </div>
      </div>
    </div>
  )
}
