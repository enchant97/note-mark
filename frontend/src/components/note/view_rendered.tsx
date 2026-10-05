import { Accessor, Component, createEffect, createResource } from 'solid-js';
import render from '~/core/renderer';
import hljs from 'highlight.js/lib/common';
import { type Context } from '~/core/renderer';

type NoteViewRenderedProps = {
  content: Accessor<string>
  context: Accessor<Context>
}

const NoteViewRendered: Component<NoteViewRenderedProps> = (props) => {

  const [contentRendered] = createResource(() => [props.content(), props.context()], ([content, context]) => {
    try {
      return render(content as string, context as Context)
    } catch {
      return "<p>Unable to render markdown, maybe you got the templating syntax incorrect?<p>"
    }
  })

  let container: HTMLDivElement | undefined;

  createEffect(() => {
    contentRendered();
    if (!container) {
      return;
    }
    hljs.highlightAll();
    attachCopyButtons(container);
  })

  return (
    <div ref={container} class="prose max-w-none break-words" innerHTML={contentRendered()}></div>
  )
}

/**
 * Add a "Copy" button to the top-right of every <pre><code> block in the
 * rendered note. The button uses the Clipboard API and shows a brief
 * "Copied!" indicator. Idempotent: existing buttons are not duplicated.
 */
function attachCopyButtons(root: HTMLElement): void {
  const blocks = root.querySelectorAll<HTMLPreElement>('pre > code');
  for (const code of Array.from(blocks)) {
    const pre = code.parentElement;
    if (!pre || pre.dataset['copyButtonAttached'] === '1') {
      continue;
    }
    pre.dataset['copyButtonAttached'] = '1';

    if (pre.style.position === '' || pre.style.position == null) {
      pre.style.position = 'relative';
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'note-mark-copy-code';
    button.setAttribute('aria-label', 'Copy code to clipboard');
    button.textContent = 'Copy';

    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.innerText);
        const original = button.textContent;
        button.textContent = 'Copied!';
        button.classList.add('is-copied');
        window.setTimeout(() => {
          button.textContent = original;
          button.classList.remove('is-copied');
        }, 1500);
      } catch {
        button.textContent = 'Failed';
        window.setTimeout(() => {
          button.textContent = 'Copy';
        }, 1500);
      }
    });

    pre.appendChild(button);
  }
}

export default NoteViewRendered;
