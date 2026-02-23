import { createResource, Show } from "solid-js";
import Redirect from "~/components/Redirect";
import { OidcVerification } from "~/core/oidc";
import * as oidcClient from 'openid-client'
import { A, useNavigate } from "@solidjs/router";
import Api from "~/core/api";
import LoadingSpin from "~/components/loading/LoadingSpin";
import { useSession } from "~/contexts/SessionProvider";

export default function OidcCallback() {
  const verification = OidcVerification.restore()
  if (verification === undefined) {
    return <Redirect href="/" />
  }
  const currentUrl = new URL(window.location.href)

  const navigate = useNavigate()
  const { apiInfo, refetchUserInfo } = useSession()

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
    await Api.authSessionStart({
      grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
      subject_token: tokens.access_token,
      subject_token_type: "urn:ietf:params:oauth:token-type:access_token",
      actor_token: tokens.id_token!,
      actor_token_type: "urn:ietf:params:oauth:token-type:id_token",
    })
    refetchUserInfo()
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
