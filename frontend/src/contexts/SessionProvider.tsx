import { createContext, createResource, useContext } from "solid-js"
import Api, { ApiError, HttpErrors } from "~/core/api"
import { optionExpect } from "~/core/helpers"

const makeSessionContext = () => {
  const [apiInfo] = createResource(Api.getServerInfo)
  const [userInfo, { mutate: mutateUserInfo, refetch: refetchUserInfo }] = createResource(async () => {
    try {
      return await Api.authGetUserInfo()
    } catch (err) {
      if (err instanceof ApiError && err.status === HttpErrors.Unauthorized) {
        return null
      }
      throw err
    }
  })
  return {
    apiInfo,
    isAuthenticated: () => (userInfo() ?? null) !== null,
    userInfo,
    refetchUserInfo,
    clearUserInfo: () => mutateUserInfo(null)
  } as const
}

type SessionContextType = ReturnType<typeof makeSessionContext>
const SessionContext = createContext<SessionContextType>()

export const useSession = () => {
  let ctx = useContext(SessionContext)
  return optionExpect(ctx, "api provider cannot be accessed")
}

export const SessionProvider = (props: any) => {
  return (
    <SessionContext.Provider value={makeSessionContext()}>
      {props.children}
    </SessionContext.Provider>
  )
}
