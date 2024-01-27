import type { Component } from 'solid-js';
import UpdateUserModal from '../components/modals/edit_user';
import UpdateUserPasswordModal from '../components/modals/new_password';
import { useCurrentUser } from '../contexts/CurrentUserProvider';
import { useModal } from '../contexts/ModalProvider';
import { User } from '../core/types';
import { A } from '@solidjs/router';
import Icon from '../components/icon';
import Header from '../components/header';
import Footer from '../components/footer';

const Profile: Component = () => {
  const { setModal, clearModal } = useModal()
  const { user, setUser } = useCurrentUser()

  const onUpdateProfileClick = () => {
    setModal({
      component: UpdateUserModal,
      props: {
        onClose: (newUser?: User) => {
          if (newUser !== undefined) {
            setUser(newUser)
          }
          clearModal()
        },
        user: user(),
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
      <Header />
      <div class="bg-base-200 p-6 mx-6">
        <h1 class="text-4xl text-center font-bold mb-4">My Profile</h1>
        <div class="card w-full max-w-md mx-auto bg-base-100">
          <div class="card-body">
            <div>username: {user()?.username}</div>
            <div class="mb-2">full-name: {user()?.name || ""}</div>
            <div class="join">
              <button
                onclick={() => onUpdateProfileClick()}
                class="btn btn-neutral join-item">
                Update Profile
              </button>
              <button
                onclick={() => onUpdatePasswordClick()}
                class="btn btn-neutral join-item">
                Change Password
              </button>
            </div>
            <A
              class="btn btn-wide btn-neutral mx-auto mt-4"
              href={`/${user()?.username}`}
            >
              <Icon name="home" />
              Back Home
            </A>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
