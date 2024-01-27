import { Component } from "solid-js";

const Footer: Component = () => {
  return (
    <footer class="footer footer-center p-4 mt-4 bg-base-300 text-base-content">
      <aside>
        <p>
          <span>Powered By </span>
          <a
            class="font-bold"
            href="https://github.com/enchant97/note-mark"
            target="_blank" rel="noopener noreferrer"
          >
            Note Mark
          </a>
        </p>
      </aside>
    </footer>
  )
}

export default Footer
