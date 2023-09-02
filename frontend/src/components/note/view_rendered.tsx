import { Accessor, Component, createResource } from 'solid-js';
import render from '../../core/renderer';

type NoteViewRenderedProps = {
  content: Accessor<string>
}

const NoteViewRendered: Component<NoteViewRenderedProps> = (props) => {

  const [contentRendered] = createResource(props.content, render)

  return (
    <div class="prose max-w-none" innerHTML={contentRendered()}></div>
  )
}

export default NoteViewRendered;
