import { Component, createContext, createSignal, useContext } from "solid-js"
import { Fatal } from "../core/core"
import { Dynamic, Portal } from "solid-js/web"

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
    if (ctx === undefined) throw new Fatal("modal was undefined")
    return ctx
}
export const ModalProvider = (props: any) => {
    return (
        <ModalContext.Provider value={makeModalContext()}>
            {props.children}
        </ModalContext.Provider>
    )
}

export const Modal: Component = () => {
    let { modal } = useModal()
    return (
        <Portal>
            {modal() && <Dynamic component={modal()?.component} {...modal()?.props} />}
        </Portal>
    )
}
