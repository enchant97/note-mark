import { Component, Show } from 'solid-js';
import { useApi } from '../contexts/ApiProvider';
import { HiOutlineUser, HiSolidMenu } from 'solid-icons/hi';
import { A } from '@solidjs/router';
import { useCurrentUser } from '../contexts/CurrentUserProvider';

const Header: Component = () => {
  let { apiDetails } = useApi()
  let user = useCurrentUser()

  return (
    <div class="w-full navbar bg-base-100">
      <div class="flex-none lg:hidden">
        <label for="main-drawer" class="btn btn-square btn-ghost">
          <HiSolidMenu size={"1.6rem"} />
        </label>
      </div>
      <span class="flex-1 px-2 mx-2 text-xl">Note Mark</span>
      <div class="flex-none">
        <div class="dropdown dropdown-end">
          <label tabindex="0" class="btn btn-ghost btn-circle shadow-lg avatar">
            <HiOutlineUser size={"1.2rem"} />
          </label>
          <ul tabindex="0" class="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-300 rounded-box w-52">
            <Show when={apiDetails().authToken} fallback={<li><A href="/login">Login</A></li>}>
              <li><span>Logged In As: <span class="kbd kbd-sm">{user()?.username}</span></span></li>
              <li><A href="/logout">Logout</A></li>
            </Show>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Header;
