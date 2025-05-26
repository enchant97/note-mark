/* @refresh reload */
// START POLLYFILL GLOBALS
import 'core-js/actual';
// END POLLYFILL GLOBALS
import '~/index.css';
import { render } from 'solid-js/web';
import { Route, Router } from '@solidjs/router';
import { registerSW } from 'virtual:pwa-register'
import Wrapper from '~/wrapper';
import Login from '~/routes/login';
import Logout from '~/routes/logout';
import Shelf from '~/routes/[username]/[...path]';
import User from '~/routes/[username]/(user)';
import MainApp from '~/MainApp';
import ScratchPad from '~/routes/scratch-pad';
import Profile from '~/routes/profile';
import Home from '~/routes/(home)';
import Signup from '~/routes/signup';
import { RequireApiSetupGuard, RequireAuthGuard, RequireNoAuthGuard, RequireSignupAllowedGuard } from '~/components/guards';
import OidcCallback from './routes/oidc-callback';

if ("serviceWorker" in navigator) {
  registerSW()
} else {
  console.debug("Service Worker capability not found in browser, so not using")
}

const root = document.getElementById('root')!
root.innerHTML = ""

import("../renderer/pkg").then(() => { console.debug("wasm backend loaded") })

render(() => (
  <Router>
    <Route path="/" component={Wrapper}>
      <Route path="/" component={() => <RequireApiSetupGuard><Home /></RequireApiSetupGuard>} />
      <Route path="/scratch-pad" component={ScratchPad} />
      <Route component={RequireNoAuthGuard}>
        <Route path="/signup" component={() => <RequireSignupAllowedGuard><Signup /></RequireSignupAllowedGuard>} />
        <Route path="/login" component={Login} />
        <Route path="/oidc-callback" component={OidcCallback} />
      </Route>
      <Route component={RequireAuthGuard}>
        <Route path="/logout" component={Logout} />
        <Route path="/profile" component={Profile} />
      </Route>
      <Route component={RequireApiSetupGuard}>
        <Route path="/" component={MainApp}>
          <Route path="/:username" component={User} />
          <Route path="/:username/:bookSlug?/:noteSlug?" component={Shelf} />
        </Route>
      </Route>
    </Route>
  </Router>
), root);
