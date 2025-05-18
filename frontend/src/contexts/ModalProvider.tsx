import { Component, Show, createContext, createEffect, createSignal, onMount, useContext } from "solid-js"
import { Dynamic, Portal } from "solid-js/web"
import { optionExpect } from "~/core/core"

type ModalProps<P = {}> = {
  component: Component
  props: P
}

const makeModalContext = () => {
  const [modal, setModal] = createSignal<ModalProps>()

  return { modal, setModal, clearModal: () => setModal(undefined) } as const
}

type ModalContextType = ReturnType<typeof makeModalContext>
export const ModalContext = createContext<ModalContextType>()
export const useModal = () => {
  let ctx = useContext(ModalContext)
  return optionExpect(ctx, "modal was undefined")
}
export const ModalProvider = (props: any) => {
  return (
    <ModalContext.Provider value={makeModalContext()}>
      {props.children}
    </ModalContext.Provider>
  )
}

export const Modal: Component = () => {
  let dialog: HTMLDialogElement | undefined
  let { modal, clearModal } = useModal()
  onMount(() => {
    dialog?.addEventListener("cancel", () => clearModal())
  })
  createEffect(_ => {
    dialog?.close()
    if (modal() !== undefined) {
      dialog?.showModal();
    }
  })
  return (
    <Portal>
      <dialog ref={dialog} class="modal backdrop-blur">
        <Show when={modal()} keyed>
          {modal => <Dynamic component={modal.component} {...modal.props} />}
        </Show>
      </dialog>
    </Portal>
  )
}
