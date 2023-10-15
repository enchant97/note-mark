import { createContext, createEffect, createMemo, useContext } from "solid-js"
import Api, { ApiHandlerConfig } from "../core/api"
import { optionExpect } from "../core/core"
import { createStore } from "solid-js/store"
import { ServerInfo } from "../core/types"
import StorageHandler from "../core/storage"

const API_DETAILS_KEY = "api_details"

export type ApiDetails = ApiHandlerConfig & {
  info?: ServerInfo
}

const readApiDetails = (): ApiHandlerConfig => {
  let apiDetails = StorageHandler.readSetting(API_DETAILS_KEY)
  if (apiDetails) {
    let parsed = JSON.parse(apiDetails)
    if (parsed.apiServer)
      return parsed
  }
  return {
    authToken: undefined,
    apiServer: (new URL("/api", window.location.origin)).toString(),
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
