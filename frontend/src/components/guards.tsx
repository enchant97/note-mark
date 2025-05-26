import { ParentProps, Show } from "solid-js"
import ShowOrRedirect from "~/components/show_or_redirect"
import { useApi } from "~/contexts/ApiProvider"
import { useAuth } from "~/contexts/AuthProvider"
import { LoadingScreen } from "~/components/loading"

export function RequireAuthGuard(props: ParentProps) {
  const { accessToken } = useAuth()
  const check = () => accessToken() !== null
  return <ShowOrRedirect when={check} redirectTo="/login">{props.children}</ShowOrRedirect>
}

export function RequireNoAuthGuard(props: ParentProps) {
  const { accessToken } = useAuth()
  const check = () => accessToken() === null
  return <ShowOrRedirect when={check} redirectTo="/">{props.children}</ShowOrRedirect>
}

export function RequireSignupAllowedGuard(props: ParentProps) {
  const { apiInfo } = useApi()
  const check = () => apiInfo()?.allowInternalSignup === true
  return <ShowOrRedirect when={check} redirectTo="/login">{props.children}</ShowOrRedirect>
}

export function RequireApiSetupGuard(props: ParentProps) {
  const { apiInfo } = useApi()
  return (
    <Show when={!apiInfo.loading} fallback={
      <LoadingScreen message="Contacting Server" />
    }>
      <Show when={apiInfo() !== undefined} fallback={
        <div class="hero min-h-screen bg-base-200">
          <div class="hero-content text-center">
            <div class="max-w-md">
              <h1 class="text-5xl font-bold mb-4">Connection to server failed.</h1>
              <button class="btn btn-primary btn-wide" onClick={() => window.location.reload()}>Retry</button>
            </div>
          </div>
        </div>
      }>
        {props.children}
      </Show>
    </Show>
  )
}
