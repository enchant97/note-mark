import { Component } from 'solid-js';
import { createStore } from "solid-js/store";
import { useApi } from '../contexts/ApiProvider';

const Login: Component = () => {
  const { api, apiDetails, setApiDetails } = useApi()
  const [formDetails, setFormDetails] = createStore({ username: "", password: "" })

  const onSubmit = async (ev: Event) => {
    ev.preventDefault()
    // TODO handle errors
    let result = (await api().postTokenPasswordFlow(formDetails.username, formDetails.password)).intoOption()
    if (result !== undefined) {
      setApiDetails({ authToken: result.access_token, apiServer: apiDetails().apiServer })
    } else {
      setFormDetails({ password: "" })
    }
  }

  return (
    <div class="hero min-h-screen bg-base-200">
      <div class="hero-content flex-col">
        <div class="text-center lg:text-left">
          <h1 class="text-5xl font-bold">Login</h1>
          <p class="py-6">Login tag line here.</p>
        </div>
        <div class="card flex-shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
          <div class="card-body">
            <form onSubmit={onSubmit}>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Username</span>
                </label>
                <input
                  class="input input-bordered"
                  value={formDetails.username}
                  oninput={(ev) => { setFormDetails({ username: ev.currentTarget.value }) }}
                  type="text"
                  placeholder="e.g. leo"
                  autocomplete="username"
                  required
                />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Password</span>
                </label>
                <input
                  class="input input-bordered"
                  value={formDetails.password}
                  oninput={(ev) => { setFormDetails({ password: ev.currentTarget.value }) }}
                  type="password"
                  placeholder="e.g. P@ssword123"
                  autocomplete="current-password"
                  required
                />
              </div>
              <div class="form-control mt-5">
                <button class="btn btn-primary" type="submit">Login</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;