import { Routes, Route, Router, A } from '@solidjs/router';
import { Component, lazy } from 'solid-js';
import { HiOutlineUser, HiSolidMenu } from "solid-icons/hi";

const Index = lazy(() => import("./pages/index"));
const Login = lazy(() => import("./pages/login"));

const App: Component = () => {
  return (
    <>
      <Router>
        <div class="drawer drawer-mobile">
          <input id="main-drawer" type="checkbox" class="drawer-toggle" />
          <div class="drawer-content">
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
                  <ul tabindex="0" class="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
                    <li><A href="/login">Login</A></li>
                  </ul>
                </div>
              </div>
            </div>
            <Routes>
              <Route path="/" component={Index} />
              <Route path="/login" component={Login} />
            </Routes>
          </div>
          <div class="drawer-side">
            <label for="main-drawer" class="drawer-overlay"></label>
            <ul class="menu p-4 w-80 bg-base-300 text-base-content">
              <li><a>Sidebar Item 1</a></li>
              <li><a>Sidebar Item 2</a></li>
            </ul>
          </div>
        </div>
      </Router>
    </>
  );
};

export default App;
