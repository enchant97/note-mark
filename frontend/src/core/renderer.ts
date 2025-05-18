import DOMPurify from 'dompurify';

import { Renderer, Context } from '../../renderer/pkg';

export { Context } from '../../renderer/pkg';

const renderer = new Renderer()

/**
* Render markdown into HTML,
* will sanitize input to prevent possible XSS attacks
* @throws Unable to render the markdown
*/
function render(content: string, context: Context): string {
  const startTime = performance.now()
  let rendered = renderer.render(content, context)
  if (rendered === undefined) {
    throw new Error("unable to render markdown")
  } else {
    content = DOMPurify.sanitize(rendered)
    const endTime = performance.now()
    console.debug(`markdown rendering and sanitization took ${endTime - startTime}ms`)
    return content
  }
}

export default render
