import { ParentProps, Show, createContext, createEffect, createMemo, onMount, useContext } from "solid-js"
import Api, { ApiError, ApiHandlerConfig, HttpErrors } from "../core/api"
import { optionExpect } from "../core/core"
import { createStore } from "solid-js/store"
import { ServerInfo } from "../core/types"
import StorageHandler from "../core/storage"
import ShowOrRedirect from "../components/show_or_redirect"
import { useNavigate } from "@solidjs/router"
import { LoadingScreen } from "../components/loading"

const API_DETAILS_KEY = "api_details"

export type ApiDetails = ApiHandlerConfig & {
  info?: ServerInfo
}

const readApiDetails = (): ApiHandlerConfig => {
  let apiDetails = StorageHandler.readSetting(API_DETAILS_KEY)
  if (apiDetails) {
    let parsed = JSON.parse(apiDetails) as ApiDetails
    if (parsed.apiServer)
      return parsed
  }
  return {
    authToken: undefined,
    apiServer: (new URL("/api", import.meta.env.VITE_BACKEND_URL || window.location.origin)).toString(),
  }
}

const writeApiDetails = (details: ApiHandlerConfig) => {
  StorageHandler.writeSetting(API_DETAILS_KEY, JSON.stringify(details))
}

const clearApiDetails = () => {
  StorageHandler.clearSetting(API_DETAILS_KEY)
}

const makeApiContext = () => {
  const [details, setDetails] = createStore<ApiDetails>(readApiDetails())
  const apiConfig: () => ApiHandlerConfig = () => {
    return {
      apiServer: details.apiServer,
      authToken: details.authToken,
    }
  }
  const api = createMemo(() => new Api(apiConfig()))
  createEffect(() => {
    writeApiDetails(apiConfig())
  })
  return {
    api,
    apiDetails: () => details,
    setApiDetails: setDetails,
    clearDetails: () => {
      clearApiDetails()
      setDetails({ ...readApiDetails(), info: undefined })
    }
  } as const
}

type ApiContextType = ReturnType<typeof makeApiContext>
export const ApiContext = createContext<ApiContextType>()
export const useApi = () => {
  let ctx = useContext(ApiContext)
  return optionExpect(ctx, "api was undefined")
}
export const ApiProvider = (props: any) => {
  return (
    <ApiContext.Provider value={makeApiContext()}>
      {props.children}
    </ApiContext.Provider>
  )
}

export function RequireAuthGuard(props: ParentProps) {
  const { apiDetails } = useApi()
  const check = () => apiDetails().authToken !== undefined
  return <ShowOrRedirect when={check} redirectTo="/login">{props.children}</ShowOrRedirect>
}

export function RequireNoAuthGuard(props: ParentProps) {
  const { apiDetails } = useApi()
  const check = () => apiDetails().authToken === undefined
  return <ShowOrRedirect when={check} redirectTo="/">{props.children}</ShowOrRedirect>
}

export function RequireSignupAllowedGuard(props: ParentProps) {
  const { apiDetails } = useApi()
  const check = () => apiDetails().info?.allowSignup === true
  return <ShowOrRedirect when={check} redirectTo="/login">{props.children}</ShowOrRedirect>
}

export function RequireApiSetupGuard(props: ParentProps) {
  const { apiDetails, setApiDetails, clearDetails } = useApi()
  const navigate = useNavigate()

  onMount(async () => {
    let result = await new Api({ apiServer: apiDetails().apiServer }).getServerInfo()
    if (result instanceof ApiError) {
      if (result.status !== HttpErrors.Unauthorized) {
        // something odd happened, reset stored details
        clearDetails()
      }
      navigate("/login")
    } else {
      setApiDetails({ info: result })
    }
  })

  return (
    <Show when={apiDetails().info !== undefined} fallback={
      <LoadingScreen message="Contacting Server" />
    }>
      {props.children}
    </Show>
  )
}
