import { JSX, Show } from "solid-js";
import Redirect from "./redirect";

type ShowOrRedirectProps = {
  when: () => boolean
  redirectTo: string
  children: JSX.Element
}

export default function ShowOrRedirect(props: ShowOrRedirectProps) {
  return (
    <Show when={props.when()} fallback={<Redirect href={props.redirectTo} />}>
      {props.children}
    </Show>
  )
}
