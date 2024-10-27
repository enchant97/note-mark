import DOMPurify from 'dompurify';

import { markdown_to_html } from '../../renderer/pkg';
// Render markdown into HTML,
// will sanitize input to prevent possible XSS attacks
function render(content: string): string {
  const startTime = performance.now()
  content = markdown_to_html(content)
  content = DOMPurify.sanitize(content)
  const endTime = performance.now()
  console.debug(`markdown rendering and sanitization took ${endTime - startTime}ms`)
  return content
}

export default render
