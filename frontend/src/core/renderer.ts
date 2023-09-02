import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.use({
  async: true,
  gfm: true,
  // disable deprecated (v5.0.0)
  headerIds: false,
  mangle: false,

})

// Render markdown into HTML,
// will sanitize input to prevent possible XSS attacks
async function render(content: string): Promise<string> {
  content = DOMPurify.sanitize(content)
  return marked.parse(content)
}

export default render
