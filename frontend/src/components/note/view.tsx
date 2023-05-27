import { Component, Show, createResource, createSignal } from 'solid-js';
import { useApi } from '../../contexts/ApiProvider';
import { Note } from '../../core/types';
import { LoadingBar } from '../loading';
import { useToast, apiErrorIntoToast } from '../../contexts/ToastProvider';
import { ApiError } from '../../core/api';
import { Result } from '../../core/core';

type NoteViewProps = {
  note: Note
}

const NoteView: Component<NoteViewProps> = (props) => {
  const { api } = useApi()
  const { pushToast } = useToast()
  const [showPlain, setShowPlain] = createSignal(false)

  const noteContentDetails = () => { return { note: props.note, showPlain: showPlain() } }

  const [noteContent] = createResource(noteContentDetails, async ({ note, showPlain }) => {
    let result: Result<string, ApiError>
    if (showPlain) {
      result = await api().getNoteContentById(note.id)
    } else {
      result = await api().getNoteRenderedById(note.id)
    }
    if (result instanceof ApiError) {
      pushToast(apiErrorIntoToast(result, "getting note content"))
      return
    } else return result
  })

  return (
    <>
      <div class="tabs mx-auto">
        <button onclick={() => setShowPlain(false)} class="tab" classList={{ "tab-active": !showPlain() }}>Rendered</button>
        <button onclick={() => setShowPlain(true)} class="tab" classList={{ "tab-active": showPlain() }}>Plain</button>
      </div>
      <Show when={noteContent() && !noteContent.loading} fallback={<LoadingBar />}>
        <div
          class="prose max-w-none"
          innerHTML={!showPlain() ? noteContent() : `<pre class="whitespace-pre-wrap">${noteContent()}<pre>`}>
        </div>
      </Show>
    </>
  )
}

export default NoteView;
