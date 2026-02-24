import '~/index.css';
import { A, Route, Router } from "@solidjs/router";
import Wrapper from "./components/Wrapper";
import { render } from "solid-js/web";
import Signup from "./routes/auth/signup";
import { RequireApiSetupGuard, RequireAuthGuard, RequireNoAuthGuard, RequireSignupAllowedGuard } from "./components/guards";
import Login from "./routes/auth/login";
import OidcCallback from "./routes/auth/oidc-callback";
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
        <Route path="/auth/signup" component={() => <RequireSignupAllowedGuard><Signup /></RequireSignupAllowedGuard>} />
        <Route path="/auth/login" component={Login} />
        <Route path="/auth/oidc-callback" component={OidcCallback} />
      </Route>
    </Route>
  </Router>
), root);
