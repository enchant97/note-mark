import { ToastProvider, Toasts } from "./contexts/ToastProvider";
import { Modal, ModalProvider } from "./contexts/ModalProvider";
import { ApiProvider } from "./contexts/ApiProvider";
import { CurrentUserProvider } from "./contexts/CurrentUserProvider";
import { ParentProps } from "solid-js";
import { AuthProvider } from "./contexts/AuthProvider";

export default function Wrapper(props: ParentProps) {
  return (
    <ToastProvider>
      <Toasts />
      <AuthProvider>
        <ModalProvider>
          <ApiProvider>
            <CurrentUserProvider>
              <Modal />
              {props.children}
            </CurrentUserProvider>
          </ApiProvider>
        </ModalProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
