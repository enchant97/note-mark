import { Component, createResource, ErrorBoundary, Match, Suspense, Switch } from "solid-js";
import Redirect from "~/components/redirect";
import { useApi } from "~/contexts/ApiProvider";
import { useAuth } from "~/contexts/AuthProvider";
import { OidcVerification } from "~/core/oidc";
import * as oidcClient from 'openid-client'
import { A, useNavigate } from "@solidjs/router";
import { OAuth2AccessToken } from "~/core/types";
import Api from "~/core/api";
import { LoadingSpin } from "~/components/loading";

const OidcCallback: Component = () => {
  const verification = OidcVerification.restore()
  if (verification === undefined) {
    return <Redirect href="/" />
  }
  const currentUrl = new URL(window.location.href)

  const navigate = useNavigate()
  const { apiInfo } = useApi()
  const { setAuthStore } = useAuth()

  const [oidcResult] = createResource(apiInfo, async (apiInfo) => {
    if (apiInfo.oidcProvider === undefined) {
      navigate("/login")
      return
    }
    const oidcConfig = await oidcClient.discovery(
      new URL(apiInfo.oidcProvider!.issuerUrl),
      apiInfo.oidcProvider!.clientId,
    )
    let access_token: OAuth2AccessToken
    let usernameHint: string
    {
      let tokens = await oidcClient.authorizationCodeGrant(oidcConfig, currentUrl, {
        pkceCodeVerifier: verification.pkceCodeVerifier,
        expectedState: verification.state,
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
        const userInfo = await oidcClient.fetchUserInfo(oidcConfig, tokens.access_token, claims!.sub)
        usernameHint = userInfo.preferred_username!
      }
    }
    const resp = await (new Api()).postExchangeOidcToken(access_token, usernameHint)
    const expiresAt = Date.now() + (resp.expires_in * 1000)
    console.debug(`login flow success, token expires at: ${new Date(expiresAt).toISOString()}`)
    setAuthStore({ accessToken: resp.access_token, expiresAt })
    return { username: usernameHint }
  })

  return (
    <div class="min-h-screen">
      <div class="hero bg-base-200 min-h-screen">
        <div class="hero-content text-center">
          <div class="max-w-md">
            <ErrorBoundary fallback={(error, _) => (
              <Switch fallback={<></>}>
                <Match when={error !== undefined}>
                  <p class="py-6">
                    Error exchanging details with provider.
                  </p>
                  <A class="btn btn-primary" href="/login">Back To Login</A>
                </Match>
              </Switch>
            )}>
              <Suspense fallback={<>
                <p class="py-6">
                  Exchanging details with provider, please wait.
                </p>
                <LoadingSpin />
              </>}>
                <p class="py-6">
                  Successfully authenticated, welcome {oidcResult()?.username}.
                </p>
                <A class="btn btn-primary" href="/">Click here if automatic redirect did not happen</A>
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OidcCallback
