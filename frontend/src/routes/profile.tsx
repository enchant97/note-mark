import type { Component } from 'solid-js';
import { A } from '@solidjs/router';
import UpdateUserModal from '~/components/modals/edit_user';
import UpdateUserPasswordModal from '~/components/modals/new_password';
import { useModal } from '~/contexts/ModalProvider';
import { User } from '~/core/types';
import Icon from '~/components/icon';
import Header from '~/components/header';
import { useApi } from '~/contexts/ApiProvider';

const Profile: Component = () => {
  const { setModal, clearModal } = useModal()
  const { userInfo, setUserInfo } = useApi()

  const onUpdateProfileClick = () => {
    setModal({
      component: UpdateUserModal,
      props: {
        onClose: (newUser?: User) => {
          if (newUser !== undefined) {
            setUserInfo(newUser)
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
            <div>username: {userInfo()?.username}</div>
            <div class="mb-2">full-name: {userInfo()?.name || ""}</div>
            <div class="join">
              <button
                onclick={() => onUpdateProfileClick()}
                class="btn join-item">
                Update Profile
              </button>
              <button
                onclick={() => onUpdatePasswordClick()}
                class="btn join-item">
                Change Password
              </button>
            </div>
            <A
              class="btn btn-wide mx-auto mt-4"
              href={`/${userInfo()?.username}`}
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

export default Profile;
