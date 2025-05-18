import { Component, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { BreadcrumbWithNames } from '~/core/types';
import Icon from '~/components/icon';

type NoteBreadcrumbProps = BreadcrumbWithNames & {
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
            <A
              activeClass="btn-disabled"
              end={true}
              href={`/${props.username}`}
            >
              <Icon name="user" size={16} />
              <span class="ml-1">{props.fullName || props.username}</span>
            </A>
          </li>
          <Show when={props.bookSlug}>
            <li>
              <A
                activeClass="btn-disabled"
                end={true}
                href={`/${props.username}/${props.bookSlug}`}
              >
                <Icon name="folder" size={16} />
                <span class="ml-1">{props.bookName}</span>
              </A>
            </li>
            <Show when={props.noteSlug}>
              <li>
                <A
                  activeClass="btn-disabled"
                  end={true}
                  href={`/${props.username}/${props.bookSlug}/${props.noteSlug}`}
                >
                  <Icon name="file" size={16} />
                  <span class="ml-1">{props.noteName}</span>
                </A>
              </li>
            </Show>
          </Show>
        </Show>
      </ul>
    </div>
  )
}

export default NoteBreadcrumb;
