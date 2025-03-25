import { Component, Suspense, createResource } from "solid-js"
import BaseModal from "./base"
import render from "../../core/renderer"
import { LoadingRing } from "../loading"
import Icon from "../icon"
import { Context } from "../../../renderer/pkg/renderer"

type PrintNoteModalProps = {
  onClose: () => any
  content: string
  context: Context
}

const PrintNoteModal: Component<PrintNoteModalProps> = (props) => {
  let iframeElement: HTMLIFrameElement
  const [contentRendered] = createResource(() => [props.content, props.context], async ([content, context]) => {
    return render(content, context)
  })

  return (
    <BaseModal title="Print Note">
      <div class="flex flex-col gap-2">
        <Suspense fallback={<LoadingRing />}>
          <div class="overflow-y-auto max-h-32 rounded border">
            <iframe
              class="w-full h-screen"
              ref={(el) => iframeElement = el}
              srcdoc={contentRendered()}>
            </iframe>
          </div>
          <button
            class="btn btn-outline"
            onClick={() => iframeElement.contentWindow?.print()}
          >
            <Icon name="printer" />
            Print</button>
        </Suspense>
        <div class="modal-action">
          <button onclick={() => props.onClose()} class="btn" type="button">Close</button>
        </div>
      </div>
    </BaseModal>
  )
}

export default PrintNoteModal
