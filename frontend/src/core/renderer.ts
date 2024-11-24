import DOMPurify from 'dompurify';

import { Renderer } from '../../renderer/pkg';

const renderer = new Renderer()

// Render markdown into HTML,
// will sanitize input to prevent possible XSS attacks
function render(content: string): string {
  const startTime = performance.now()
  content = renderer.markdown_to_html(content)
  content = DOMPurify.sanitize(content)
  const endTime = performance.now()
  console.debug(`markdown rendering and sanitization took ${endTime - startTime}ms`)
  return content
}

export default render
