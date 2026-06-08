import { Accessor } from 'solid-js';

export default function NoteViewPlain(props: { content: Accessor<string> }) {
  return (
    <div class="prose max-w-none"><pre class="whitespace-pre-wrap shadow-glass rounded-box">{props.content()}</pre></div>
  )
}
