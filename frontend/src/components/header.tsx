import { Component, For, Show, createEffect, createSignal } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { THEMES, getTheme, setTheme } from '~/core/theme_switcher';
import Icon from '~/components/icon';
import { useAuth } from '~/contexts/AuthProvider';
import { useApi } from '~/contexts/ApiProvider';

const ThemeSwitcher: Component = () => {
  const [currentTheme, setCurrentTheme] = createSignal(getTheme())
  createEffect(() =>
    setTheme(currentTheme())
  )

  return (
    <details class="dropdown dropdown-end">
      <summary class="btn btn-ghost shadow flex gap-2">
        <Icon name="sun" />
        <Icon name="moon" />
      </summary>
      <menu class="mt-2 p-2 shadow-lg menu menu-sm dropdown-content z-[1] bg-base-300 rounded-box">
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
      </menu>
    </details>
  )
}

const ProfileDropdown = () => {
  const navigate = useNavigate()
  const { accessToken, setAuthStore } = useAuth()
  const { userInfo } = useApi()

  return (
    <details class="dropdown dropdown-end">
      <summary class="btn btn-ghost btn-circle shadow"><Icon name="user" /></summary>
      <menu class="mt-2 p-2 shadow-lg menu dropdown-content z-[1] bg-base-300 rounded-box w-52">
        <Show when={userInfo()} fallback={<li>
          <Show when={accessToken()} fallback={<A href="/login">Login</A>}>
            <button onclick={() => {
              setAuthStore(null)
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
      </menu>
    </details>
  )
}

export type HeaderProps = {
  disableDrawerToggle?: boolean,
}

const Header: Component<HeaderProps> = (props) => {
  const { userInfo } = useApi()

  return (
    <div class="w-full navbar bg-base-300-blur shadow-lg sticky top-0 z-10">
      <Show when={!props.disableDrawerToggle}>
        <label for="main-drawer" class="lg:hidden btn btn-square btn-ghost shadow">
          <Icon name="menu" />
        </label>
      </Show>
      <span class="px-2 mx-2 text-xl hidden sm:block">Note Mark</span>
      <div class="flex-1"></div>
      <div class="flex gap-4">
        <ThemeSwitcher />
        <A
          class="btn btn-ghost btn-circle shadow"
          activeClass="btn-disabled"
          href="/scratch-pad"
          title="Scratch Pad"
        ><Icon name="file-text" /></A>
        <A
          activeClass="btn-disabled"
          class="btn btn-ghost btn-circle shadow"
          end={true}
          href={userInfo() === undefined ? "/" : `/${userInfo()?.username}`}
        ><Icon name="home" /></A>
        <ProfileDropdown />
      </div>
    </div >
  );
};

export default Header;
