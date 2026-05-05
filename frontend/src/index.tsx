// START POLYFILLS
import "core-js/actual/object"; // for: `Object.hasOwn()`
import "core-js/actual/structured-clone"; // for: `structuredClone()`
// END POLYFILLS
import '~/index.css';
import { Route, Router } from "@solidjs/router";
import Wrapper from "./components/Wrapper";
import { render } from "solid-js/web";
import Signup from "./routes/auth/signup";
import { RequireApiSetupGuard, RequireAuthGuard, RequireNoAuthGuard, RequireSignupAllowedGuard } from "./components/guards";
import Login from "./routes/auth/login";
import OidcCallback from "./routes/auth/oidc-callback";
import { getTheme, setTheme } from './core/theme-switcher';
import Home from './routes/(home)';
import User from './routes/[username]/(user)';
import MainApp from './components/MainApp';
import Profile from './routes/profile';
import ScratchPad from './routes/scratch-pad';
import Node from './routes/[username]/[...fullSlug]';
import Redirect from './components/Redirect';

const root = document.getElementById('root')!
root.innerHTML = ""

import("../renderer/pkg").then(() => { console.debug("wasm backend loaded") })

setTheme(getTheme()) // TODO remove this later

render(() => (
  <Router>
    <Route path="/" component={Wrapper}>
      <Route path="/" component={() => <RequireApiSetupGuard><Home /></RequireApiSetupGuard>} />
      <Route path="/scratch-pad" component={ScratchPad} />
      <Route component={RequireNoAuthGuard}>
        <Route path="/auth/signup" component={() => <RequireSignupAllowedGuard><Signup /></RequireSignupAllowedGuard>} />
        <Route path="/auth/login" component={Login} />
        <Route path="/auth/oidc-callback" component={OidcCallback} />
      </Route>
      <Route component={RequireAuthGuard}>
        <Route path="/profile" component={Profile} />
      </Route>
      <Route component={RequireApiSetupGuard}>
        <Route path="/" component={MainApp}>
          <Route path="/:username" component={User} />
          <Route path="/:username/*encodedFullSlug" component={Node} />
          <Route path="/:username/.trash/*" component={() => <Redirect href="/" />} />
        </Route>
      </Route>
    </Route>
  </Router>
), root);
