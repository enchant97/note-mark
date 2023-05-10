import { Routes, Route, Router } from '@solidjs/router';
import { Component, lazy } from 'solid-js';
import { ApiProvider } from './contexts/ApiProvider';
import Header from './components/header';

const Index = lazy(() => import("./pages/index"));
const Login = lazy(() => import("./pages/login"));

const App: Component = () => {


  return (
    <Router>
      <ApiProvider>
        <div class="drawer drawer-mobile">
          <input id="main-drawer" type="checkbox" class="drawer-toggle" />
          <div class="drawer-content">
            <Header />
            <Routes>
              <Route path="/" component={Index} />
              <Route path="/login" component={Login} />
              <Route path="/logout" element={<></>} />
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
      </ApiProvider>
    </Router>
  );
};

export default App;
