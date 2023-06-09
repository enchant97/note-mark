import { Component, Show } from 'solid-js';
import { Breadcrumb } from '../../core/types';
import { FiFile, FiFolder, FiUser } from 'solid-icons/fi';

type NoteBreadcrumbProps = Breadcrumb & {
  class?: string
}

const NoteBreadcrumb: Component<NoteBreadcrumbProps> = (props) => {
  const extraClass = () => {
    if (props.class !== undefined) return " " + props.class
    return ""
  }
  return (
    <div class={"p-2 text-sm breadcrumbs rounded-md shadow-md bg-base-200 flex" + extraClass()}>
      <ul>
        <Show when={props.username}>
          <li>
            <FiUser size={16} />
            <span class="ml-1">{props.username}</span>
          </li>
          <Show when={props.bookSlug}>
            <li>
              <FiFolder size={16} />
              <span class="ml-1">{props.bookSlug}</span>
            </li>
            <Show when={props.noteSlug}>
              <li>
                <FiFile size={16} />
                <span class="ml-1">{props.noteSlug}</span>
              </li>
            </Show>
          </Show>
        </Show>
      </ul>
    </div>
  )
}

export default NoteBreadcrumb;
