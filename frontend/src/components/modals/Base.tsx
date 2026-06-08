import type { ParentProps } from 'solid-js';

type BaseModalProps = ParentProps & {
  title: string
}

export default function BaseModal(props: BaseModalProps) {
  return (
    <div class="modal-box backdrop-glass shadow-glass">
      <h3 class="font-bold text-lg">{props.title}</h3>
      {props.children}
    </div>
  );
}
