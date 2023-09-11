import { Component } from "solid-js";

export const LoadingBar: Component = () => {
  return <progress class="progress w-full"></progress>
}

export const LoadingSpin: Component = () => {
  return <span class="loading loading-spinner m-auto block mt-2"></span>
}

export const LoadingRing: Component = () => {
  return <span class="loading loading-ring loading-ring-lg block m-auto"></span>
}

type LoadingScreenProps = {
  message?: string
}

export const LoadingScreen: Component<LoadingScreenProps> = (props) => {
  return (
    <div class="hero min-h-screen bg-base-200">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1 class="text-5xl font-bold mb-4">{props.message || "Loading"}</h1>
          <div class="loading loading-spinner loading-lg"></div>
        </div>
      </div>
    </div>
  )
}
