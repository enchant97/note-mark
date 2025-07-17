import { Component, onMount } from "solid-js"
import render from "~/core/renderer"
import { type Context } from "~/core/renderer"

type PrintNoteModalProps = {
  onClose: () => any
  content: string
  context: Context
}

const PrintNoteModal: Component<PrintNoteModalProps> = (props) => {
  let iframeElement: HTMLIFrameElement

  onMount(() => {
    iframeElement.contentWindow!.addEventListener("afterprint", () => props.onClose())
    iframeElement.contentWindow!.print()
  })

  return (
    <iframe
      class="w-full h-screen hidden"
      ref={(el) => iframeElement = el}
      srcdoc={render(props.content, props.context)}>
    </iframe>
  )
}

export default PrintNoteModal
