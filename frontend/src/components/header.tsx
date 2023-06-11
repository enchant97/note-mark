import { Component, For, createEffect, createSignal } from 'solid-js';
import { useApi } from '../contexts/ApiProvider';
import { A } from '@solidjs/router';
import { useCurrentUser } from '../contexts/CurrentUserProvider';
import { useModal } from '../contexts/ModalProvider';
import ApiUrlModal from './modals/api_url';
import { THEMES, getTheme, setTheme } from '../core/theme_switcher';
import Icon from './icon';
import { ServerInfo } from '../core/types';

const ThemeSwitcher: Component = () => {
  const [currentTheme, setCurrentTheme] = createSignal(getTheme())
  createEffect(() =>
    setTheme(currentTheme())
  )
  return (
    <div class="dropdown dropdown-end">
      <label tabindex="0" class="btn btn-ghost shadow-lg flex gap-2">
        <Icon name="sun" />
        <Icon name="moon" />
      </label>
      <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 p-2 shadow bg-base-300 rounded-box">
        <For each={THEMES}>
          {(theme) => (
            <li><button
              onclick={() => setCurrentTheme(theme.name)}
              classList={{ "active": currentTheme() === theme.name }}
              type="button"
            >
              {theme.title}
            </button></li>
          )}
        </For>
      </ul>
    </div>
  )
}

const ProfileDropdownNoAuth = () => {
  const { apiDetails, setApiDetails } = useApi()
  const { setModal, clearModal } = useModal()

  const onChangeServerClick = () => {
    setModal({
      component: ApiUrlModal,
      props: {
        onClose: (config?: { apiServer: string, info: ServerInfo }) => {
          if (config) setApiDetails(config)
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
  const { user } = useCurrentUser()

  return (
    <>
      <li class="menu-title"><span>Logged In As: <span class="kbd kbd-sm">{user()?.username}</span></span></li>
      <li><A href="/profile">My Profile</A></li>
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
          <Icon name="menu" />
        </label>
      </div>
      <span class="flex-1 px-2 mx-2 text-xl">Note Mark</span>
      <div class="flex gap-4">
        <ThemeSwitcher />
        <A activeClass="btn-disabled" class="btn btn-ghost btn-circle shadow-lg" end={true} href="/"><Icon name="home" /></A>
        <div class="dropdown dropdown-end">
          <label tabindex="0" class="btn btn-ghost btn-circle shadow-lg">
            <Icon name="user" />
          </label>
          <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 p-2 shadow bg-base-300 rounded-box w-52">
            {apiDetails().authToken && <ProfileDropdownHasAuth /> || <ProfileDropdownNoAuth />}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Header;
