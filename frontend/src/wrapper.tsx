import { ParentProps } from "solid-js";
import { ToastProvider, Toasts } from "~/contexts/ToastProvider";
import { Modal, ModalProvider } from "~/contexts/ModalProvider";
import { ApiProvider } from "~/contexts/ApiProvider";
import { AuthProvider } from "~/contexts/AuthProvider";

export default function Wrapper(props: ParentProps) {
  return (
    <ToastProvider>
      <Toasts />
      <AuthProvider>
        <ModalProvider>
          <ApiProvider>
            <Modal />
            {props.children}
          </ApiProvider>
        </ModalProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
