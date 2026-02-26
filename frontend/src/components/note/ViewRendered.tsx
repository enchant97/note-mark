import { createEffect, createResource } from 'solid-js';
import hljs from 'highlight.js/lib/common';
import { NoteEngineReadOnly } from '~/core/note-engine';

export default function NoteViewRendered(props: { noteEngine: NoteEngineReadOnly }) {

  const [contentRendered] = createResource(() => [props.noteEngine.content()], () => {
    try {
      return props.noteEngine.render()
    } catch {
      return "<p>Unable to render markdown, maybe you got the templating syntax incorrect?<p>"
    }
  })

  createEffect(() => {
    contentRendered()
    hljs.highlightAll()
  })

  return (
    <div class="prose max-w-none break-words" innerHTML={contentRendered()}></div>
  )
}
