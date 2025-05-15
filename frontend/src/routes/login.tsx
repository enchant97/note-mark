import { Component, Show, createSignal } from 'solid-js';
import { createStore } from "solid-js/store";
import { A } from '@solidjs/router';
import { useApi } from '~/contexts/ApiProvider';
import { ApiError } from '~/core/api';
import { apiErrorIntoToast, useToast } from '~/contexts/ToastProvider';
import Icon from '~/components/icon';
import Header from '~/components/header';
import Footer from '~/components/footer';
import { useAuth } from '~/contexts/AuthProvider';

const Login: Component = () => {
  const { api, apiInfo } = useApi()
  const { setAuthStore } = useAuth()
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
      const expiresAt = Date.now() + (result.expires_in * 1000)
      console.debug(`login flow success, token expires at: ${new Date(expiresAt).toISOString()}`)
      setAuthStore({ accessToken: result.access_token, expiresAt })
    }
  }

  return (
    <div class="min-h-screen">
      <Header disableDrawerToggle={true} />
      <div class="bg-base-200 p-6 mx-6">
        <div class="card w-full max-w-md mx-auto bg-base-100">
          <div class="card-body text-center">
            <img class="mb-2 mx-auto w-36" src="/icon.svg" alt="Note Mark Icon" />
            <h1 class="text-5xl font-bold">Note Mark</h1>
            <p class="py-6">Login here.</p>
            <form onSubmit={onSubmit}>
              <label class="form-control">
                <span class="label label-text">Username</span>
                <input
                  class="input input-bordered"
                  value={formDetails.username}
                  oninput={(ev) => { setFormDetails({ username: ev.currentTarget.value }) }}
                  type="text"
                  placeholder="e.g. leo"
                  autocomplete="username"
                  required
                />
              </label>
              <label class="form-control">
                <span class="label label-text">Password</span>
                <input
                  class="input input-bordered"
                  value={formDetails.password}
                  oninput={(ev) => { setFormDetails({ password: ev.currentTarget.value }) }}
                  type="password"
                  placeholder="e.g. P@ssword123"
                  autocomplete="current-password"
                  required
                />
              </label>
              <Show when={!apiInfo()}>
                <div class="alert my-4 bg-error text-error-content">
                  <Icon name="info" />
                  <span>No server available to handle requests!</span>
                </div>
              </Show>
              <div class="join join-vertical w-full mt-5">
                <button class="btn join-item btn-primary" disabled={loading() || !apiInfo()} type="submit">
                  {loading() && <span class="loading loading-spinner"></span>}
                  Login
                </button>
                {apiInfo()?.allowSignup !== false && <A class="btn join-item" href="/signup" classList={{ "btn-disabled": !apiInfo() }}>Need An Account?</A>}
                <A class="btn join-item" href="/" classList={{ "btn-disabled": !apiInfo() }}>Back Home</A>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
