import { createContext, createResource, useContext } from "solid-js"
import { Fatal } from "../core/core"
import { useApi } from "./ApiProvider"

const makeCurrentUserContext = () => {
    const { api } = useApi()
    const [user] = createResource(api, async (current_api) => {
        if (current_api.isAuthenticated()) {
            let result = await current_api.getUsersMe()
            // TODO error handle this!
            return result.unwrap()
        }
        return undefined
    })
    return () => user()
}

type CurrentUserContextType = ReturnType<typeof makeCurrentUserContext>
export const CurrentUserContext = createContext<CurrentUserContextType>()
export const useCurrentUser = () => {
    let ctx = useContext(CurrentUserContext)
    if (ctx === undefined) throw new Fatal("current user was undefined")
    return ctx
}
export const CurrentUserProvider = (props: any) => {
    return (
        <CurrentUserContext.Provider value={makeCurrentUserContext()}>
            {props.children}
        </CurrentUserContext.Provider>
    )
}
