import { Component, For, Show, createEffect, createSignal } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { useCurrentUser } from '../contexts/CurrentUserProvider';
import { THEMES, getTheme, setTheme } from '../core/theme_switcher';
import Icon from './icon';
import { useApi } from '../contexts/ApiProvider';

const ThemeSwitcher: Component = () => {
  const [currentTheme, setCurrentTheme] = createSignal(getTheme())
  createEffect(() =>
    setTheme(currentTheme())
  )
  return (
    <div class="dropdown dropdown-end z-10">
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

const ProfileDropdown = () => {
  const navigate = useNavigate()
  const { apiDetails, setApiDetails } = useApi()
  const { user } = useCurrentUser()

  return (
    <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 p-2 shadow bg-base-300 rounded-box w-52">
      <Show when={user()} fallback={<li>
        <Show when={apiDetails().authToken} fallback={<A href="/login">Login</A>}>
          <button onclick={() => {
            setApiDetails({ authToken: undefined })
            navigate("/login")
          }}>Re-Login</button>
        </Show>
      </li>} keyed>
        {user => <>
          <li class="menu-title"><span>Logged In As: <span class="kbd kbd-sm">{user.username}</span></span></li>
          <li><A href="/profile">My Profile</A></li>
          <li><A href="/logout">Logout</A></li>
        </>}
      </Show>
    </ul>
  )
}

const Header: Component = () => {
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
        <div class="dropdown dropdown-end z-10">
          <label tabindex="0" class="btn btn-ghost btn-circle shadow-lg">
            <Icon name="user" />
          </label>
          <ProfileDropdown />
        </div>
      </div>
    </div>
  );
};

export default Header;
