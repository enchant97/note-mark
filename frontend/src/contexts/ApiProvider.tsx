import { createContext, createMemo, createResource, useContext } from "solid-js"
import Api, { ApiError } from "~/core/api"
import { optionExpect } from "~/core/core"
import { useAuth } from "~/contexts/AuthProvider"

const makeApiContext = () => {
  const { accessToken } = useAuth()
  const api = createMemo(() => new Api(accessToken() || undefined))
  const [apiInfo] = createResource(api, async (api) => {
    const r = await api.getServerInfo()
    if (r instanceof ApiError) {
      return undefined
    }
    return r
  })
  return {
    api,
    apiInfo,
  } as const
}

type ApiContextType = ReturnType<typeof makeApiContext>
const ApiContext = createContext<ApiContextType>()

export const useApi = () => {
  let ctx = useContext(ApiContext)
  return optionExpect(ctx, "api provider cannot be accessed")
}

export const ApiProvider = (props: any) => {
  return (
    <ApiContext.Provider value={makeApiContext()}>
      {props.children}
    </ApiContext.Provider>
  )
}
