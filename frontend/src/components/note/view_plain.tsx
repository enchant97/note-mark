import { Accessor, Component } from 'solid-js';

type NoteViewPlainProps = {
  content: Accessor<string>
}

const NoteViewPlain: Component<NoteViewPlainProps> = (props) => {
  return (
    <div class="prose max-w-none"><pre class="whitespace-pre-wrap shadow-glass rounded-box">{props.content()}</pre></div>
  )
}

export default NoteViewPlain;
