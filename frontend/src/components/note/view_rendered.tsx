import { Accessor, Component, createEffect, createResource } from 'solid-js';
import render from '../../core/renderer';
import hljs from 'highlight.js/lib/common';

type NoteViewRenderedProps = {
  content: Accessor<string>
}

const NoteViewRendered: Component<NoteViewRenderedProps> = (props) => {

  const [contentRendered] = createResource(props.content, render)

  createEffect(() => {
    contentRendered()
    hljs.highlightAll()
  })

  return (
    <div class="prose max-w-none break-words" innerHTML={contentRendered()}></div>
  )
}

export default NoteViewRendered;
