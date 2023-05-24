import { Component } from 'solid-js';
import { useApi } from '../contexts/ApiProvider';
import { HiOutlineHome, HiOutlineUser, HiSolidMenu } from 'solid-icons/hi';
import { A } from '@solidjs/router';
import { useCurrentUser } from '../contexts/CurrentUserProvider';
import { useModal } from '../contexts/ModalProvider';
import ApiUrlModal from './modals/api_url';

const ProfileDropdownNoAuth = () => {
  const { apiDetails, setApiDetails } = useApi()
  const { setModal, clearModal } = useModal()

  const onChangeServerClick = () => {
    setModal({
      component: ApiUrlModal,
      props: {
        onClose: (newUrl?: string) => {
          if (newUrl) {
            setApiDetails({ apiServer: newUrl })
          }
          clearModal()
        },
        apiUrl: apiDetails().apiServer,
      },
    })
  }

  return (
    <>
      <li><button onclick={onChangeServerClick} type="button">Change Server</button></li>
      <li><A href="/login">Login</A></li>
    </>
  )
}

const ProfileDropdownHasAuth = () => {
  const user = useCurrentUser()

  return (
    <>
      <li class="menu-title"><span>Logged In As: <span class="kbd kbd-sm">{user()?.username}</span></span></li>
      <li><A href="/logout">Logout</A></li>
    </>
  )
}

const Header: Component = () => {
  const { apiDetails } = useApi()

  return (
    <div class="w-full navbar bg-base-100">
      <div class="flex-none lg:hidden">
        <label for="main-drawer" class="btn btn-square btn-ghost">
          <HiSolidMenu size={20} />
        </label>
      </div>
      <span class="flex-1 px-2 mx-2 text-xl">Note Mark</span>
      <div class="flex gap-4">
        <A activeClass="btn-disabled" class="btn btn-ghost btn-circle shadow-lg" end={true} href="/"><HiOutlineHome size={20} /></A>
        <div class="dropdown dropdown-end">
          <label tabindex="0" class="btn btn-ghost btn-circle shadow-lg">
            <HiOutlineUser size={20} />
          </label>
          <ul tabindex="0" class="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-300 rounded-box w-52">
            {apiDetails().authToken && <ProfileDropdownHasAuth /> || <ProfileDropdownNoAuth />}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Header;
