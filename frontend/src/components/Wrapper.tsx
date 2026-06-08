import { ParentProps } from "solid-js";
import { ToastProvider, Toasts } from "~/contexts/ToastProvider";
import { SessionProvider } from "~/contexts/SessionProvider";
import { Modal, ModalProvider } from "~/contexts/ModalProvider";
export default function Wrapper(props: ParentProps) {
  return (
    <ToastProvider>
      <Toasts />
      <SessionProvider>
        <ModalProvider>
          <Modal />
          {props.children}
        </ModalProvider>
      </SessionProvider>
    </ToastProvider>
  )
}
