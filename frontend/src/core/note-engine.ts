import DOMPurify from 'dompurify';
import { NoteEngine as NoteEngineInternal } from '../../renderer/pkg';
import { Accessor, createSignal } from 'solid-js';
import { Frontmatter } from '~/core/types';
import { ApiServerBaseUrl } from '~/core/api';

export interface NoteEngineReadOnly {
  content: Accessor<string>
  frontmatter: Accessor<Frontmatter>,
  render: () => string
  tryIntoRaw: () => string
}

export interface NoteEngine extends NoteEngineReadOnly {
  setContent: (newContent: string) => any
  setFrontmatter: (newFrontmatter: Frontmatter) => any
  tryFromRaw: (raw: string) => any
}

export function createNoteEngine(rawContent?: string): NoteEngine {
  let engineOptions = {
    apiBaseUrl: ApiServerBaseUrl + "/",
  }
  let noteEngine: NoteEngineInternal
  if (rawContent === undefined) {
    noteEngine = new NoteEngineInternal(engineOptions)
  } else {
    noteEngine = NoteEngineInternal.try_from_raw(rawContent, engineOptions)
  }
  const [content, setContent] = createSignal(noteEngine.content)
  const [frontmatter, setFrontmatter] = createSignal<Frontmatter>(noteEngine.frontmatter)
  return {
    content,
    setContent: (newContent: string) => {
      noteEngine.content = newContent
      setContent(newContent)
    },
    frontmatter,
    setFrontmatter: (newFrontmatter: Frontmatter) => {
      noteEngine.frontmatter = newFrontmatter
      setFrontmatter(newFrontmatter)
    },
    render: () => {
      const startTime = performance.now()
      const unsanitized_html = noteEngine.render_to_html()
      const sanitized_html = DOMPurify.sanitize(unsanitized_html)
      const endTime = performance.now()
      console.debug(`[PERF] rendering note took ${endTime - startTime}ms`)
      return sanitized_html
    },
    tryIntoRaw: () => noteEngine.try_into_raw(),
    tryFromRaw: (raw: string) => {
      noteEngine = NoteEngineInternal.try_from_raw(raw, engineOptions)
      setContent(noteEngine.content)
      setFrontmatter(noteEngine.frontmatter)
    },
  }
}
