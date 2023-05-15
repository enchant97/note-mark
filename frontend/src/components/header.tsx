import { Component, Show } from 'solid-js';
import { useApi } from '../contexts/ApiProvider';
import { HiOutlineHome, HiOutlineUser, HiSolidMenu } from 'solid-icons/hi';
import { A } from '@solidjs/router';
import { useCurrentUser } from '../contexts/CurrentUserProvider';

const Header: Component = () => {
  const { apiDetails } = useApi()
  const user = useCurrentUser()

  return (
    <div class="w-full navbar bg-base-100">
      <div class="flex-none lg:hidden">
        <label for="main-drawer" class="btn btn-square btn-ghost">
          <HiSolidMenu size={20} />
        </label>
      </div>
      <span class="flex-1 px-2 mx-2 text-xl">Note Mark</span>
      <div class="flex gap-4">
        <A activeClass="btn-disabled" class="btn btn-ghost btn-circle shadow-lg avatar" end={true} href="/"><HiOutlineHome size={20} /></A>
        <div class="dropdown dropdown-end">
          <label tabindex="0" class="btn btn-ghost btn-circle shadow-lg avatar">
            <HiOutlineUser size={20} />
          </label>
          <ul tabindex="0" class="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-300 rounded-box w-52">
            <Show when={apiDetails().authToken} fallback={<li><A href="/login">Login</A></li>}>
              <li class="menu-title"><span>Logged In As: <span class="kbd kbd-sm">{user()?.username}</span></span></li>
              <li><A href="/logout">Logout</A></li>
            </Show>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Header;
