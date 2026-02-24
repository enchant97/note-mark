import { Accessor, createEffect, createResource } from 'solid-js';
import render from '~/core/renderer';
import hljs from 'highlight.js/lib/common';

export default function NoteViewRendered(props: { content: Accessor<string> }) {

  const [contentRendered] = createResource(() => [props.content()], ([content]) => {
    try {
      return render(content)
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
