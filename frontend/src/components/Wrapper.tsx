import { ParentProps } from "solid-js";
import { ToastProvider, Toasts } from "~/contexts/ToastProvider";
import { SessionProvider } from "~/contexts/SessionProvider";
export default function Wrapper(props: ParentProps) {
  return (
    <ToastProvider>
      <Toasts />
      <SessionProvider>
        {props.children}
      </SessionProvider>
    </ToastProvider>
  )
}
