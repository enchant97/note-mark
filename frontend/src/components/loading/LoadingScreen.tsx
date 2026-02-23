export default function LoadingScreen(props: { message?: string }) {
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
