import { useNavigate } from "@solidjs/router";
import { Component, onMount } from "solid-js";

const OidcCallback: Component = () => {
  const navigate = useNavigate()
  onMount(() => {
    if (window.opener === null) {
      navigate("/")
    } else {
      window.close()
    }
  })
  return (
    <></>
  )
}

export default OidcCallback
