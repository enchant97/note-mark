import DOMPurify from 'dompurify';

import { markdown_to_html } from '../../renderer/pkg';
// Render markdown into HTML,
// will sanitize input to prevent possible XSS attacks
function render(content: string): string {
  content = markdown_to_html(content)
  return DOMPurify.sanitize(content)
}

export default render
