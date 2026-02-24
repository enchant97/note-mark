import { createEffect, createSignal, For, Show } from "solid-js"
import { getTheme, setTheme, THEMES } from "~/core/theme-switcher"
import Icon from "./Icon"
import { A, useSubmission } from "@solidjs/router"
import { useSession } from "~/contexts/SessionProvider"

function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = createSignal(getTheme())
  createEffect(() =>
    setTheme(currentTheme())
  )

  return (
    <details class="dropdown">
      <summary class="btn flex gap-2">
        <Icon name="sun" />
        <Icon name="moon" />
      </summary>
      <ul class="mt-2 p-2 menu dropdown-content z-[1] w-52 bg-base-100">
        <For each={THEMES}>
          {(theme) => (
            <li><button
              onclick={(ev) => {
                setCurrentTheme(theme.name)
                ev.currentTarget.closest("details")?.removeAttribute("open")
              }}
              classList={{ "active": currentTheme() === theme.name }}
              type="button"
            >
              {theme.title}
            </button></li>
          )}
        </For>
      </ul>
    </details>
  )
}

function ProfileDropdown() {
  const { userInfo, endSession } = useSession()
  const endSessionSubmission = useSubmission(endSession)

  return (
    <details class="dropdown dropdown-end">
      <summary class="btn btn-circle"><Icon name="user" /></summary>
      <menu class="mt-2 p-2 menu dropdown-content z-[1] bg-base-100 w-52">
        <Show when={userInfo()} fallback={<li><A href="/auth/login">Login</A></li>} keyed>
          {user => <>
            <li class="menu-title"><span>Logged In As: <span class="kbd kbd-sm">{user.preferred_username}</span></span></li>
            <li><A href="/profile">My Profile</A></li>
            <li><button
              disabled={endSessionSubmission.pending}
              onClick={() => endSession()}
            >Logout</button></li>
          </>}
        </Show>
      </menu>
    </details>
  )
}

export default function Header(props: { disableDrawerToggle?: boolean }) {
  const { userInfo } = useSession()

  return (
    <div class="sticky top-2 z-10 px-2">
      <div class="navbar backdrop-glass shadow-glass">
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
            class="btn btn-circle"
            activeClass="btn-disabled"
            href="/scratch-pad"
            title="Scratch Pad"
          ><Icon name="file-text" /></A>
          <A
            title="Home"
            activeClass="btn-disabled"
            class="btn btn-circle"
            end={true}
            href={(userInfo() ?? null) === null ? "/" : `/${userInfo()?.preferred_username}`}
          ><Icon name="home" /></A>
          <ProfileDropdown />
        </div>
      </div>
    </div>
  );
}
