import { Component, createResource, Show } from "solid-js";
import Redirect from "~/components/redirect";
import { OidcVerification } from "~/core/oidc";
import * as oidcClient from 'openid-client'
import { A, useNavigate } from "@solidjs/router";
import Api from "~/core/api";
import { LoadingSpin } from "~/components/loading";
import { useSession } from "~/contexts/SessionProvider";

const OidcCallback: Component = () => {
  const verification = OidcVerification.restore()
  if (verification === undefined) {
    return <Redirect href="/" />
  }
  const currentUrl = new URL(window.location.href)

  const navigate = useNavigate()
  const { apiInfo, setIsAuthenticated } = useSession()

  const [oidcResult] = createResource(apiInfo, async (apiInfo) => {
    if (apiInfo.oidcProvider === undefined) {
      navigate("/login")
      return
    }
    const oidcConfig = await oidcClient.discovery(
      new URL(apiInfo.oidcProvider!.issuerUrl),
      apiInfo.oidcProvider!.clientId,
    )
    const tokens = await oidcClient.authorizationCodeGrant(oidcConfig, currentUrl, {
      pkceCodeVerifier: verification.pkceCodeVerifier,
      expectedState: verification.state,
      idTokenExpected: true,
    })
    await Api.postExchangeOidcToken(tokens.access_token, tokens.id_token!)
    setIsAuthenticated(true)
    console.debug("login flow success")
    navigate("/")
    return
  })

  return (
    <div class="min-h-screen">
      <div class="hero bg-base-200 min-h-screen">
        <div class="hero-content text-center">
          <div class="max-w-md">
            <Show when={!oidcResult.loading} fallback={<>
              <p class="py-6">
                Exchanging details with provider, please wait.
              </p>
              <LoadingSpin />
            </>}>
              <Show when={oidcResult.error === undefined} fallback={
                <>
                  <p class="pt-6">
                    Error exchanging details with provider.
                  </p>
                  <p class="pt-2 pb-6">{`(${oidcResult.error.message})`}</p>
                  <A class="btn btn-primary" href="/login">Back To Login</A>
                </>
              }>
                <p class="py-6">
                  Successfully authenticated.
                </p>
                <A class="btn btn-primary" href="/">Click here if automatic redirect did not happen</A>
              </Show>
            </Show>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OidcCallback
