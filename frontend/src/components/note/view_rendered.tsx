import { Accessor, Component, createEffect, createResource } from 'solid-js';
import render from '~/core/renderer';
import hljs from 'highlight.js/lib/common';
import { type Context } from '~/core/renderer';

type NoteViewRenderedProps = {
  content: Accessor<string>
  context: Accessor<Context>
}

const NoteViewRendered: Component<NoteViewRenderedProps> = (props) => {

  const [contentRendered] = createResource(() => [props.content(), props.context()], ([content, context]) => {
    try {
      return render(content as string, context as Context)
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

export default NoteViewRendered;
