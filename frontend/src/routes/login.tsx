import { Component, Show, createSignal } from 'solid-js';
import { createStore } from "solid-js/store";
import { useApi } from '../contexts/ApiProvider';
import { A } from '@solidjs/router';
import { ApiError } from '../core/api';
import { apiErrorIntoToast, useToast } from '../contexts/ToastProvider';
import WithApiSelect from '../components/with_api_select';
import Icon from '../components/icon';

const Login: Component = () => {
  const { api, apiDetails, setApiDetails } = useApi()
  const { pushToast } = useToast()
  const [formDetails, setFormDetails] = createStore({ username: "", password: "" })
  const [loading, setLoading] = createSignal(false)

  const onSubmit = async (ev: Event) => {
    ev.preventDefault()
    setLoading(true)
    let result = await api().postTokenPasswordFlow(formDetails.username, formDetails.password)
    setLoading(false)

    if (result instanceof ApiError) {
      pushToast(apiErrorIntoToast(result, "logging-in"))
      setFormDetails({ password: "" })
    } else {
      console.debug(`login flow success, token expires in ${result.expires_in}`)
      setApiDetails({ authToken: result.access_token, apiServer: apiDetails().apiServer })
    }
  }

  return (
    <div class="hero min-h-screen bg-base-200">
      <div class="hero-content w-full flex-col">
        <div class="card flex-shrink-0 w-full max-w-md shadow-2xl bg-base-100">
          <div class="card-body">
            <img class="mb-2 mx-auto w-36" src="/icon.svg" alt="Note Mark Icon" />
            <div class="text-center">
              <h1 class="text-5xl font-bold">Note Mark</h1>
              <p class="py-6">Login here.</p>
            </div>
            <form onSubmit={onSubmit}>
              <WithApiSelect>
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
                <Show when={!apiDetails().info}>
                  <div class="alert my-4">
                    <Icon name="info" />
                    <span>No valid server set!</span>
                  </div>
                </Show>
                <div class="join join-vertical w-full mt-5">
                  <button class="btn join-item btn-primary" disabled={loading() || !apiDetails().info} type="submit">
                    {loading() && <span class="loading loading-spinner"></span>}
                    Login
                  </button>
                  {apiDetails().info?.allowSignup !== false && <A class="btn join-item" href="/signup">Need An Account?</A>}
                  <A class="btn join-item" href="/" classList={{ "btn-disabled": !apiDetails().info }}>Back Home</A>
                </div>
              </WithApiSelect>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
