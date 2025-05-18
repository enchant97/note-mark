import { ParentProps, Show } from "solid-js";
import Redirect from "~/components/redirect";

type ShowOrRedirectProps = ParentProps & {
  when: () => boolean
  redirectTo: string
}

export default function ShowOrRedirect(props: ShowOrRedirectProps) {
  return (
    <Show when={props.when()} fallback={<Redirect href={props.redirectTo} />}>
      {props.children}
    </Show>
  )
}
