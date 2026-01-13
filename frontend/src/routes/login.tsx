import { Component, Show, createResource, createSignal } from 'solid-js';
import { createStore } from "solid-js/store";
import { A, action, redirect, useAction } from '@solidjs/router';
import Api from '~/core/api';
import { apiErrorIntoToast, ToastType, useToast } from '~/contexts/ToastProvider';
import Icon from '~/components/icon';
import Header from '~/components/header';
import * as oidcClient from 'openid-client'
import { OidcVerification } from '~/core/oidc';
import { LoadingSpin } from '~/components/loading';
import { useSession } from '~/contexts/SessionProvider';

const Login: Component = () => {
  const { apiInfo, setIsAuthenticated } = useSession()
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
    try {
      await Api.postTokenPasswordFlow(formDetails.username, formDetails.password)
      setFormDetails({ password: "" })
      setIsAuthenticated(true)
      console.debug("login flow success")
    } catch (e) {
      pushToast(apiErrorIntoToast(e, "logging-in"))
    } finally {
      setLoading(false)
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
        <div class="p-6 mx-6">
          <div class="flex w-full max-w-md mx-auto">
            <div class="card-body text-center">
              <img class="mb-2 mx-auto w-36" src="/icon.svg" alt="Note Mark Icon" />
              <h1 class="text-5xl font-bold">Note Mark</h1>
              <Show when={!apiInfo()}>
                <div class="alert my-4 bg-error text-error-content">
                  <Icon name="info" />
                  <span>No server available to handle requests!</span>
                </div>
              </Show>
              <Show when={apiInfo()?.allowInternalLogin} fallback={<></>}>
                <form onSubmit={onSubmit}>
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">Login Here</legend>
                    <label class="input validator">
                      <Icon name="user" />
                      <input
                        value={formDetails.username}
                        oninput={(ev) => { setFormDetails({ username: ev.currentTarget.value }) }}
                        type="text"
                        placeholder="Username"
                        autocomplete="username"
                        required
                      />
                    </label>
                    <label class="input validator">
                      <Icon name="lock" />
                      <input
                        value={formDetails.password}
                        oninput={(ev) => { setFormDetails({ password: ev.currentTarget.value }) }}
                        type="password"
                        placeholder="Password"
                        autocomplete="current-password"
                        required
                      />
                    </label>
                  </fieldset>
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
      </Show>
    </div>
  );
};

export default Login;
