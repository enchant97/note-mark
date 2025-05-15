import { createContext, createSignal, useContext } from "solid-js"
import StorageHandler from "~/core/storage"
import { optionExpect } from "~/core/core"

const AUTH_STORE_KEY = "auth_store"

export interface AuthStoreType {
  accessToken: string
  expiresAt: number
}

const readAuthStore = (): AuthStoreType | null => {
  let authStore = StorageHandler.readSetting(AUTH_STORE_KEY)
  if (authStore) {
    return JSON.parse(authStore)
  }
  return null
}

const writeAuthStore = (v: AuthStoreType | null) => {
  if (v === null) {
    StorageHandler.clearSetting(AUTH_STORE_KEY)
  } else {
    StorageHandler.writeSetting(AUTH_STORE_KEY, JSON.stringify(v))
  }
}

function makeAuthContext() {
  const [authStore, setAuthStore] = createSignal<AuthStoreType | null>(readAuthStore())
  return {
    accessToken: () => {
      const store = authStore()
      if (store !== null && store.expiresAt < Date.now()) {
        // access token has expired
        setAuthStore(null)
        return null
      }
      return store?.accessToken || null

    },
    setAuthStore: (v: AuthStoreType | null) => {
      writeAuthStore(v)
      setAuthStore(v)
    },
  } as const
}

type AuthContextType = ReturnType<typeof makeAuthContext>
const AuthContext = createContext<AuthContextType>()

export function useAuth() {
  let ctx = useContext(AuthContext)
  return optionExpect(ctx, "auth provider cannot be accessed")
}

export function AuthProvider(props: any) {
  return (
    <AuthContext.Provider value={makeAuthContext()}>
      {props.children}
    </AuthContext.Provider>
  )
}
