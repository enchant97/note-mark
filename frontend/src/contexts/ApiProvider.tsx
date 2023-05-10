import { createContext, createEffect, createSignal, useContext } from "solid-js"
import Api, { ApiDetails } from "../core/api"

const api_details_key = "api_details"

const readApiDetails = (): ApiDetails => {
    let apiDetails = window.localStorage.getItem(api_details_key)
    if (!apiDetails) {
        return JSON.parse(apiDetails)
    }
    return {
        authToken: null,
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
    const [details, setDetails] = createSignal<ApiDetails>(readApiDetails())
    const [api, setApi] = createSignal<Api>(new Api(readApiDetails()));
    // XXX bad practice to set a signal inside of an effect, but it works...
    createEffect(() => {
        let newDetails = details()
        setApi(api => api.setApi(newDetails))
        writeApiDetails(newDetails)
    })
    return {
        api,
        details,
        setDetails,
        clearDetails: () => {
            clearApiDetails()
            setDetails(readApiDetails())
        }
    } as const
}

type ApiContextType = ReturnType<typeof makeApiContext>
export const ApiContext = createContext<ApiContextType>()
export const useApi = () => useContext(ApiContext)
export const ApiProvider = (props: any) => {
    return (
        <ApiContext.Provider value={makeApiContext()}>
            {props.children}
        </ApiContext.Provider>
    )
}
