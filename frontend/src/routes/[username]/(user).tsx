import { A, useNavigate, useParams } from "@solidjs/router";
import { Show } from "solid-js";
import UserSearchModal from "~/components/modals/UserSearch";
import { useModal } from "~/contexts/ModalProvider";
import Icon from "~/components/Icon";
import { useSession } from "~/contexts/SessionProvider";
import { useNodeTree } from "~/contexts/NodeTreeProvider";
import CreateNoteModal from "~/components/modals/CreateNote";
import { NodeEntry } from "~/core/types";

export default function User() {
  const params = useParams<{
    username: string,
  }>()
  const nodeTree = useNodeTree()
  const { setModal, clearModal } = useModal()
  const { isAuthenticated, userInfo } = useSession()
  const navigate = useNavigate()

  const openUserSearchModal = () => {
    setModal({
      component: UserSearchModal,
      props: {
        onClose: () => clearModal(),
      },
    })
  }

  const onCreateNoteClick = () => {
    setModal({
      component: CreateNoteModal,
      props: {
        currentUsername: params.username,
        onClose: (nodeEntry?: NodeEntry) => {
          clearModal()
          if (nodeEntry) {
            nodeTree.insertNode(nodeEntry)
            navigate(`/${params.username}/${nodeEntry.fullSlug}`)
          }
        },
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
            <Show when={userInfo()?.preferred_username === params.username} fallback={
              <A
                class="btn join-item"
                href={`/${userInfo()?.preferred_username}`}
              >My Notes</A>
            }>
              <button
                class="btn join-item"
                onclick={onCreateNoteClick}
                type="button"
                title="Create New Note"
              >
                <Icon name="file-plus" />
                New Note
              </button>
            </Show>
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
