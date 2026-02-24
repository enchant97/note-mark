import { A } from '@solidjs/router';
import UpdateUserModal from '~/components/modals/UpdateUser';
import UpdateUserPasswordModal from '~/components/modals/UpdateUserPassword';
import { useModal } from '~/contexts/ModalProvider';
import { User } from '~/core/types';
import Icon from '~/components/Icon';
import Header from '~/components/Header';
import { useSession } from '~/contexts/SessionProvider';

export default function Profile() {
  const { setModal, clearModal } = useModal()
  const { apiInfo, userInfo, refetchUserInfo } = useSession()

  const onUpdateProfileClick = () => {
    setModal({
      component: UpdateUserModal,
      props: {
        onClose: (newUser?: User) => {
          if (newUser !== undefined) {
            refetchUserInfo()
          }
          clearModal()
        },
        user: userInfo(),
      },
    })
  }

  const onUpdatePasswordClick = () => {
    setModal({
      component: UpdateUserPasswordModal,
      props: {
        onClose: clearModal,
      },
    },
    )
  }

  return (
    <div class="min-h-screen">
      <Header disableDrawerToggle={true} />
      <div class="p-6 mx-6">
        <div class="flex max-w-md mx-auto">
          <div class="card-body">
            <h1 class="text-4xl text-center font-bold mb-4">My Profile</h1>
            <div>username: {userInfo()?.preferred_username}</div>
            <div class="mb-2">full-name: {userInfo()?.name || ""}</div>
            <div class="join">
              <button
                onclick={() => onUpdateProfileClick()}
                class="btn join-item">
                Update Profile
              </button>
              {apiInfo()?.allowInternalLogin &&
                <button
                  onclick={() => onUpdatePasswordClick()}
                  class="btn join-item">
                  Change Password
                </button>}
            </div>
            <A
              class="btn btn-wide mx-auto mt-4"
              href={`/${userInfo()?.preferred_username}`}
            >
              <Icon name="home" />
              Back Home
            </A>
          </div>
        </div>
      </div>
    </div>
  );
};
