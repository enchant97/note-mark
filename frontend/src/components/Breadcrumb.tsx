import { A } from "@solidjs/router"
import Icon from "./Icon"
import { For } from "solid-js"

export default function Breadcrumb(props: { class?: string, username: string, fullSlug: string }) {
  const extraClass = () => {
    if (props.class !== undefined) return " " + props.class
    return ""
  }
  const slugParts = () => props.fullSlug.split("/")
  return (
    <div class={"p-2 text-sm breadcrumbs shadow-glass rounded-box flex" + extraClass()}>
      <ul>
        <li>
          <A
            activeClass="breadcrumb-disabled"
            end={true}
            href={`/${props.username}`}
          >
            <Icon name="user" size={16} />
            <span class="ml-1">{props.username}</span>
          </A>
        </li>
        <For each={slugParts()} fallback={<></>}>
          {(currentSlugPart, i) => {
            const p = [props.username, ...slugParts().slice(0, i()), currentSlugPart].join("/")
            return (
              <li>
                <A
                  activeClass="breadcrumb-disabled"
                  end={true}
                  href={`/${p}`}
                >
                  <Icon name="file" size={16} />
                  <span class="ml-1">{currentSlugPart}</span>
                </A>
              </li>
            )
          }}
        </For>
      </ul>
    </div>
  )
}
