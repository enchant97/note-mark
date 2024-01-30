import { ToastProvider, Toasts } from "./contexts/ToastProvider";
import { Modal, ModalProvider } from "./contexts/ModalProvider";
import { ApiProvider } from "./contexts/ApiProvider";
import { CurrentUserProvider } from "./contexts/CurrentUserProvider";

export default function Wrapper(props) {
  return (
    <ToastProvider>
      <Toasts />
      <ModalProvider>
        <ApiProvider>
          <CurrentUserProvider>
            <Modal />
            {props.children}
          </CurrentUserProvider>
        </ApiProvider>
      </ModalProvider>
    </ToastProvider>
  )
}
