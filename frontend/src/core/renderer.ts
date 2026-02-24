import DOMPurify from 'dompurify';

import { Renderer } from '../../renderer/pkg';

const renderer = new Renderer()

/**
* Render markdown into HTML,
* will sanitize input to prevent possible XSS attacks
* @throws Unable to render the markdown
*/
export default function render(content: string): string {
  const startTime = performance.now()
  let rendered = renderer.markdown_to_html(content)
  if (rendered === undefined) {
    throw new Error("unable to render markdown")
  } else {
    content = DOMPurify.sanitize(rendered)
    const endTime = performance.now()
    console.debug(`markdown rendering and sanitization took ${endTime - startTime}ms`)
    return content
  }
}
