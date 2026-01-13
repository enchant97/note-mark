import { ParentProps } from "solid-js";
import { ToastProvider, Toasts } from "~/contexts/ToastProvider";
import { Modal, ModalProvider } from "~/contexts/ModalProvider";
import { SessionProvider } from "./contexts/SessionProvider";

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
