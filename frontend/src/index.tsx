import '~/index.css';
import { A, Route, Router } from "@solidjs/router";
import Wrapper from "./components/Wrapper";
import { render } from "solid-js/web";
import Signup from "./routes/signup";
import { RequireApiSetupGuard, RequireAuthGuard, RequireNoAuthGuard, RequireSignupAllowedGuard } from "./components/guards";
import Login from "./routes/login";
import OidcCallback from "./routes/oidc-callback";
import Logout from "./routes/logout";
import { getTheme, setTheme } from './core/theme-switcher';
import Home from './routes/(home)';

const root = document.getElementById('root')!
root.innerHTML = ""

setTheme(getTheme()) // TODO remove this later

render(() => (
  <Router>
    <Route path="/" component={Wrapper}>
      <Route path="/" component={() => <RequireApiSetupGuard><Home /></RequireApiSetupGuard>} />
      <Route component={RequireNoAuthGuard}>
        <Route path="/signup" component={() => <RequireSignupAllowedGuard><Signup /></RequireSignupAllowedGuard>} />
        <Route path="/login" component={Login} />
        <Route path="/oidc-callback" component={OidcCallback} />
      </Route>
      <Route component={RequireAuthGuard}>
        <Route path="/logout" component={Logout} />
      </Route>
    </Route>
  </Router>
), root);
