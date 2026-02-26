import DOMPurify from 'dompurify';
import { NoteEngine as NoteEngineInternal } from '../../renderer/pkg';
import { Accessor, createSignal } from 'solid-js';

export interface NoteEngineReadOnly {
  content: Accessor<string>
  render: () => string
  tryIntoRaw: () => string
}

export interface NoteEngine extends NoteEngineReadOnly {
  setContent: (newContent: string) => any
}

export function createNoteEngine(rawContent: string): NoteEngine {
  const noteEngine = NoteEngineInternal.try_from_raw(rawContent)
  const [content, setContent] = createSignal(noteEngine.content)
  return {
    content,
    setContent: (newContent: string) => {
      noteEngine.content = newContent
      setContent(newContent)
    },
    render: () => {
      const unsanitized_html = noteEngine.render_to_html()
      return DOMPurify.sanitize(unsanitized_html)
    },
    tryIntoRaw: () => noteEngine.try_into_raw(),
  }
}
