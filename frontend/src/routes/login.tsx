import { Component, Show, createResource, createSignal } from 'solid-js';
import { createStore } from "solid-js/store";
import { A } from '@solidjs/router';
import { useApi } from '~/contexts/ApiProvider';
import Api, { ApiError } from '~/core/api';
import { apiErrorIntoToast, ToastType, useToast } from '~/contexts/ToastProvider';
import Icon from '~/components/icon';
import Header from '~/components/header';
import Footer from '~/components/footer';
import { useAuth } from '~/contexts/AuthProvider';
import * as oidcClient from 'openid-client'
import { OAuth2AccessToken } from '~/core/types';
import { LoadingSpin } from '~/components/loading';

const Login: Component = () => {
  const { api, apiInfo } = useApi()
  const { setAuthStore } = useAuth()
  const { pushToast } = useToast()
  const [formDetails, setFormDetails] = createStore({ username: "", password: "" })
  const [loading, setLoading] = createSignal(false)
  const [oidcPopup, setOidcPopup] = createSignal<Window | null>(null)
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

  const startOidcFlow = async (oidcDiscovery: oidcClient.Configuration) => {
    setLoading(true)
    try {
      // START setup-oidc
      const code_verifier = oidcClient.randomPKCECodeVerifier()
      const code_challenge = await oidcClient.calculatePKCECodeChallenge(code_verifier)
      const redirect_uri = (new URL("/oidc-callback", window.location.origin)).toString()
      const scope = "openid profile"
      let state: string
      const parameters: Record<string, string> = {
        redirect_uri,
        scope,
        code_challenge,
        code_challenge_method: 'S256',
      }
      if (!oidcDiscovery.serverMetadata().supportsPKCE()) {
        state = oidcClient.randomState()
        parameters.state = state
      }
      const redirectTo = oidcClient.buildAuthorizationUrl(oidcDiscovery, parameters)
      // END setup-oidc
      let popup = window.open(redirectTo.href, "_blank");
      if (popup === null) {
        pushToast({ message: "failed to start authentication flow", type: ToastType.ERROR })
        return
      }
      setOidcPopup(popup)
      setLoading(false)
      const closeCheck = setInterval(async () => {
        if (popup.closed) {
          clearInterval(closeCheck)
          setLoading(true)
          try {
            let access_token: OAuth2AccessToken
            let usernameHint: string
            {
              let url = new URL(popup.location.href)
              if (url.searchParams.get("state") === "") {
                // remove empty state as it interferes when using PKCE
                url.searchParams.delete("state")
              }
              let tokens = await oidcClient.authorizationCodeGrant(oidcDiscovery, url, {
                pkceCodeVerifier: code_verifier,
                expectedState: state,
                idTokenExpected: true,
              })
              const claims = tokens.claims()
              access_token = {
                access_token: tokens.access_token,
                token_type: tokens.token_type,
                expires_in: tokens.expires_in || 0,
              }
              // only request user info if claims were not provided
              // (some providers give them in the claims when 'profile' scope is included)
              if (claims?.preferred_username) {
                usernameHint = claims.preferred_username.toString()
              } else {
                const userInfo = await oidcClient.fetchUserInfo(oidcDiscovery, tokens.access_token, claims!.sub)
                usernameHint = userInfo.preferred_username!
              }
            }
            const resp = await (new Api()).postExchangeOidcToken(access_token, usernameHint)
            if (resp instanceof (ApiError)) {
              pushToast(apiErrorIntoToast(resp, "exchanging authentication"))
            } else {
              const expiresAt = Date.now() + (resp.expires_in * 1000)
              console.debug(`login flow success, token expires at: ${new Date(expiresAt).toISOString()}`)
              setAuthStore({ accessToken: resp.access_token, expiresAt })
            }
            setOidcPopup(null)
          } catch (e) {
            pushToast({
              message: "failed to finish authentication flow",
              type: ToastType.ERROR,
            })
          }
          finally {
            setLoading(false)
          }
        }
      }, 500)
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <div class="min-h-screen">
      <Show when={oidcPopup() === null} fallback={
        <div class="hero bg-base-200 min-h-screen">
          <div class="hero-content text-center">
            <Show when={loading()} fallback={
              <div class="max-w-md">
                <p class="py-6">
                  Please complete the authentication with your provider, in the new window.
                </p>
                <button
                  class="btn btn-neutral"
                  onClick={() => {
                    oidcPopup()?.close()
                    setOidcPopup(null)
                    setLoading(false)
                  }}
                >Nothing happened?</button>
              </div>
            }>
              <div class="max-w-md">
                <p class="py-6">
                  Exchanging details with provider, please wait.
                </p>
                <LoadingSpin />
              </div>
            </Show>
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
