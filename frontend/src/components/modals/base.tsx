import type { Component, ParentProps } from 'solid-js';

type BaseModalProps = ParentProps & {
  title: string
}

const BaseModal: Component<BaseModalProps> = (props) => {
  return (
    <div class="modal-box backdrop-glass shadow-glass">
      <h3 class="font-bold text-lg">{props.title}</h3>
      {props.children}
    </div>
  );
};

export default BaseModal;
