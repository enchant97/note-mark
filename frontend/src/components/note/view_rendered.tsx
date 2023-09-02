import { Accessor, Component } from 'solid-js';
import render from '../../core/renderer';

type NoteViewRenderedProps = {
  content: Accessor<string>
}

const NoteViewRendered: Component<NoteViewRenderedProps> = (props) => {
  const contentRendered = () => {
    return render(props.content())
  }

  return (
    <div class="prose max-w-none" innerHTML={contentRendered()}></div>
  )
}

export default NoteViewRendered;
