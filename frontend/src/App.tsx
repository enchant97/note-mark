import { Routes, Route } from '@solidjs/router';
import { Component, lazy } from 'solid-js';
import Header from './components/header';
import { useApi } from './contexts/ApiProvider';
import ProtectedRoute from './components/protected_route';

const Index = lazy(() => import("./pages/index"));
const Login = lazy(() => import("./pages/login"));
const Logout = lazy(() => import("./pages/logout"));

const App: Component = () => {
  const { apiDetails } = useApi()

  const hasAuth = () => {
    return apiDetails().authToken !== undefined
  }

  const hasNoAuth = () => {
    return !hasAuth()
  }

  return (
    <div class="drawer drawer-mobile">
      <input id="main-drawer" type="checkbox" class="drawer-toggle" />
      <div class="drawer-content">
        <Header />
        <Routes>
          <Route path="/" component={Index} />
          <ProtectedRoute path="/login" redirectPath="/" condition={hasNoAuth} component={Login} />
          <ProtectedRoute path="/logout" redirectPath="/" condition={hasAuth} component={Logout} />
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
  );
};

export default App;
