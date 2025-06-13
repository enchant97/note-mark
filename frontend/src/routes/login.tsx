import { Component, Show, createResource, createSignal } from 'solid-js';
import { createStore } from "solid-js/store";
import { A, action, redirect, useAction } from '@solidjs/router';
import { useApi } from '~/contexts/ApiProvider';
import { ApiError } from '~/core/api';
import { apiErrorIntoToast, ToastType, useToast } from '~/contexts/ToastProvider';
import Icon from '~/components/icon';
import Header from '~/components/header';
import Footer from '~/components/footer';
import { useAuth } from '~/contexts/AuthProvider';
import * as oidcClient from 'openid-client'
import { OidcVerification } from '~/core/oidc';
import { LoadingSpin } from '~/components/loading';

const Login: Component = () => {
  const { api, apiInfo } = useApi()
  const { setAuthStore } = useAuth()
  const { pushToast } = useToast()
  const [formDetails, setFormDetails] = createStore({ username: "", password: "" })
  const [loading, setLoading] = createSignal(false)
  const [oidcLoading, setOidcLoading] = createSignal(false)
  const [oidcDiscovery] = createResource(apiInfo, async (apiInfo) => {
    if (apiInfo.oidcProvider) {
      try {
        return await oidcClient.discovery(
          new URL(apiInfo.oidcProvider!.issuerUrl),
          apiInfo.oidcProvider!.clientId,
        )
      }
      catch (e) {
        pushToast({
          message: "failed to communicate with authentication provider",
          type: ToastType.ERROR,
        })
        throw e
      }

    }
  })

  const startOidcFlow = useAction(action(async (oidcDiscovery) => {
    setOidcLoading(true)
    const state = oidcClient.randomState()
    const verification = new OidcVerification(
      oidcClient.randomPKCECodeVerifier(),
      state,
    )
    verification.save()
    const code_challenge = await oidcClient.calculatePKCECodeChallenge(verification.pkceCodeVerifier)
    const callbackUrl = (new URL("/oidc-callback", window.location.origin)).toString()
    const scope = "openid profile"
    const parameters: Record<string, string> = {
      redirect_uri: callbackUrl,
      scope,
      code_challenge,
      code_challenge_method: 'S256',
      state,
    }
    throw redirect(oidcClient.buildAuthorizationUrl(oidcDiscovery, parameters).href)
  }))
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
      <Show when={!oidcLoading()} fallback={
        <div class="hero bg-base-200 min-h-screen">
          <div class="hero-content text-center">
            <div class="max-w-md">
              <p class="py-6">
                Taking you to your authentication provider, please wait.
              </p>
              <LoadingSpin />
            </div>
          </div>
        </div>
      }>
        <Header disableDrawerToggle={true} />
        <div class="bg-base-200 p-6 mx-6">
          <div class="card w-full max-w-md mx-auto bg-base-100">
            <div class="card-body text-center">
              <img class="mb-2 mx-auto w-36" src="/icon.svg" alt="Note Mark Icon" />
              <h1 class="text-5xl font-bold">Note Mark</h1>
              <p class="py-6">Login here.</p>
              <Show when={!apiInfo()}>
                <div class="alert my-4 bg-error text-error-content">
                  <Icon name="info" />
                  <span>No server available to handle requests!</span>
                </div>
              </Show>
              <Show when={apiInfo()?.allowInternalLogin} fallback={<></>}>
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
                  <div class="join join-vertical w-full mt-5">
                    <button
                      class="btn btn-primary"
                      classList={{ "join-item": apiInfo()?.allowInternalSignup }}
                      disabled={loading() || !apiInfo()}
                      type="submit"
                    >
                      {loading() && <span class="loading loading-spinner"></span>}
                      Login
                    </button>
                    {apiInfo()?.allowInternalSignup !== false && <A
                      class="btn join-item"
                      href="/signup"
                      classList={{ "btn-disabled": !apiInfo() }}
                    >Need An Account?</A>}
                  </div>
                </form>
              </Show>
              <Show when={apiInfo()?.oidcProvider} fallback={<></>}>
                {apiInfo()?.allowInternalLogin && <div class="divider">Or</div>}
                <button
                  class="btn"
                  classList={{ "mt-5": !apiInfo()?.allowInternalLogin }}
                  type="button"
                  disabled={oidcDiscovery.loading || oidcDiscovery.error || loading()}
                  onClick={() => startOidcFlow(oidcDiscovery()!)}
                >
                  {oidcDiscovery.loading && <span class="loading loading-spinner"></span>}
                  Login With {apiInfo()?.oidcProvider?.displayName}
                </button>
              </Show>
            </div>
          </div>
        </div>
        <Footer />
      </Show>
    </div>
  );
};

export default Login;
