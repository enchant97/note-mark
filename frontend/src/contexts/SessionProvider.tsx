import { createContext, createResource, useContext } from "solid-js"
import Api from "~/core/api"
import { optionExpect } from "~/core/core"
import { User } from "~/core/types"

const makeSessionContext = () => {
  const [apiInfo] = createResource(Api.getServerInfo)
  const [isAuthenticated, { mutate: setIsAuthenticated }] = createResource(Api.getAmIAuthenticated)
  const [userInfo, { mutate: setUserInfo }] = createResource(isAuthenticated, async (hasAuth) => {
    if (!hasAuth) {
      return null
    }
    return await Api.getUsersMe()
  })
  return {
    apiInfo,
    isAuthenticated,
    userInfo,
    setIsAuthenticated,
    setUserInfo: (v: User) => {
      if (!v) {
        setUserInfo(v)
      }
    },
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
