import { createContext, createEffect, useContext } from "solid-js"
import Api, { ApiHandlerConfig } from "../core/api"
import { optionExpect } from "../core/core"
import { createStore } from "solid-js/store"
import { ServerInfo } from "../core/types"

const api_details_key = "note_mark__api_details"

export type ApiDetails = ApiHandlerConfig & {
  info?: ServerInfo
}

const readApiDetails = (): ApiDetails => {
  let apiDetails = window.localStorage.getItem(api_details_key)
  if (apiDetails) {
    return JSON.parse(apiDetails)
  }
  return {
    authToken: undefined,
    apiServer: (new URL("/api", window.location.origin)).toString(),
  }
}

const writeApiDetails = (details: ApiDetails) => {
  window.localStorage.setItem(api_details_key, JSON.stringify(details))
}

const clearApiDetails = () => {
  window.localStorage.removeItem(api_details_key)
}

const makeApiContext = () => {
  const [details, setDetails] = createStore<ApiDetails>(readApiDetails())
  createEffect(() => {
    writeApiDetails({ apiServer: details.apiServer, authToken: details.authToken })
  })
  return {
    api: () => new Api(details),
    apiDetails: () => details,
    setApiDetails: setDetails,
    clearDetails: () => {
      clearApiDetails()
      setDetails(readApiDetails())
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
