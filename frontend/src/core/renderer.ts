import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.use({
  gfm: true,
  // disable deprecated (v5.0.0)
  headerIds: false,
  mangle: false,

})

// Render markdown into HTML,
// will sanitize input to prevent possible XSS attacks
function render(content: string): string {
  content = DOMPurify.sanitize(content)
  return marked.parse(content)
}

export default render
