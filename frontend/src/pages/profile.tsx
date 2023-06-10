import type { Component } from 'solid-js';
import UpdateUserModal from '../components/modals/edit_user';
import { useCurrentUser } from '../contexts/CurrentUserProvider';
import { useModal } from '../contexts/ModalProvider';
import { User } from '../core/types';

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

  return (
    <div class="bg-base-200 p-6 rounded-md">
      <h1 class="text-xl font-bold">My Profile</h1>
      <div>username: {user()?.username}</div>
      <div class="mb-2">full-name: {user()?.name || ""}</div>
      <div class="join">
        <button onclick={() => onUpdateProfileClick()} class="btn join-item">Update Profile</button>
        <button class="btn btn-disabled join-item">Change Password</button>
      </div>
    </div>
  );
};

export default Profile;
