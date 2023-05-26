import { Component, createSignal } from 'solid-js';
import { createStore } from "solid-js/store";
import { useApi } from '../contexts/ApiProvider';
import { A } from '@solidjs/router';
import { resultIntoOption } from '../core/core';

const Login: Component = () => {
  const { api, apiDetails, setApiDetails } = useApi()
  const [formDetails, setFormDetails] = createStore({ username: "", password: "" })
  const [loading, setLoading] = createSignal(false)

  const onSubmit = async (ev: Event) => {
    ev.preventDefault()
    setLoading(true)
    // TODO handle errors
    let result = resultIntoOption(await api().postTokenPasswordFlow(formDetails.username, formDetails.password))
    setLoading(false)
    if (result !== undefined) {
      setApiDetails({ authToken: result.access_token, apiServer: apiDetails().apiServer })
    } else {
      setFormDetails({ password: "" })
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
              <div class="btn-group btn-group-vertical w-full mt-5">
                <button class="btn btn-primary" classList={{ loading: loading() }} type="submit">Login</button>
                <A class="btn" href="/signup">Need An Account?</A>
                <A class="btn" href="/">Back Home</A>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
