import { onMount } from "solid-js"
import { NoteEngineReadOnly } from "~/core/note-engine"

export default function PrintModal(props: {
  onClose: () => any,
  noteEngine: NoteEngineReadOnly,
}) {
  let iframeElement: HTMLIFrameElement

  onMount(() => {
    iframeElement.contentWindow!.addEventListener("afterprint", () => props.onClose())
    iframeElement.contentWindow!.print()
  })

  return (
    <iframe
      class="w-full h-screen hidden"
      ref={(el) => iframeElement = el}
      srcdoc={props.noteEngine.render()}>
    </iframe>
  )
}
