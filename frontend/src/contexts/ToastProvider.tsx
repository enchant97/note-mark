import { Component, For, createContext, onMount, useContext } from "solid-js"
import { Fatal } from "../core/core"
import { Portal } from "solid-js/web"
import { createStore } from "solid-js/store"

export enum ToastType {
  INFO = "info",
  SUCCESS = "success",
  ERROR = "error",
  WARNING = "warning",
}

export type Toast = {
  message: string
  type: ToastType
}

const makeToastContext = () => {
  const [toasts, setToasts] = createStore<Toast[]>([])

  return {
    toasts,
    pushToast: (newToast: Toast) => { setToasts([...toasts, newToast]) },
    deleteToast: (index: number) => {
      let newToasts = Array.from(toasts)
      newToasts.splice(index, 1)
      setToasts(newToasts)
    },
  } as const
}

type ToastContextType = ReturnType<typeof makeToastContext>
export const ToastContext = createContext<ToastContextType>()
export const useToast = () => {
  let ctx = useContext(ToastContext)
  if (ctx === undefined) throw new Fatal("toast context was undefined")
  return ctx
}
export const ToastProvider = (props: any) => {
  return (
    <ToastContext.Provider value={makeToastContext()}>
      {props.children}
    </ToastContext.Provider>
  )
}

type ToastItemProps = {
  toast: Toast
  index: number
}

const ToastItem: Component<ToastItemProps> = (props) => {
  const { deleteToast } = useToast()

  onMount(() => {
    setTimeout(() => {
      deleteToast(props.index)
    }, 6000)
  })

  return (
    // class="alert-info alert-success alert-warning alert-error"
    <div class={"transition-opacity	duration-400 ease-in-out alert alert-" + props.toast.type}>
      <div><span>{props.toast.message}</span></div>
    </div>
  )
}

export const Toasts: Component = () => {
  const { toasts } = useToast()

  return (
    <Portal>
      <div class="toast toast-end">
        <For each={toasts}>
          {(toast, index) => <ToastItem toast={toast} index={index()} />}
        </For>
      </div>
    </Portal>
  )
}
