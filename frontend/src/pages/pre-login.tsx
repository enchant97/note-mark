import { Component, onMount } from "solid-js"
import { useApi } from "../contexts/ApiProvider"
import { useNavigate } from "@solidjs/router"
import Api from "../core/api"
import { LoadingScreen } from "../components/loading"

const PreLogin: Component = () => {
  const { apiDetails, setApiDetails } = useApi()
  const navigate = useNavigate()

  onMount(async () => {
    let result = await new Api({ apiServer: apiDetails().apiServer }).getServerInfo()
    if (result instanceof Error) navigate("/login")
    else {
      setApiDetails({ info: result })
      history.back()
    }
  })

  return <LoadingScreen />
}

export default PreLogin
