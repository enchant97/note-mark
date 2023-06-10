import { createContext, createResource, useContext } from "solid-js"
import { optionExpect } from "../core/core"
import { useApi } from "./ApiProvider"
import { apiErrorIntoToast, useToast } from "./ToastProvider"
import { ApiError } from "../core/api"

const makeCurrentUserContext = () => {
  const { api } = useApi()
  const { pushToast } = useToast()
  const [user, { mutate }] = createResource(api, async (current_api) => {
    if (current_api.isAuthenticated()) {
      let result = await current_api.getUsersMe()
      if (result instanceof ApiError) {
        pushToast(apiErrorIntoToast(result, "getting user details"))
        return undefined
      } else return result
    }
    return undefined
  })
  return {
    user: user,
    setUser: mutate,
  } as const
}

type CurrentUserContextType = ReturnType<typeof makeCurrentUserContext>
export const CurrentUserContext = createContext<CurrentUserContextType>()
export const useCurrentUser = () => {
  let ctx = useContext(CurrentUserContext)
  return optionExpect(ctx, "current user was undefined")
}
export const CurrentUserProvider = (props: any) => {
  return (
    <CurrentUserContext.Provider value={makeCurrentUserContext()}>
      {props.children}
    </CurrentUserContext.Provider>
  )
}
