import type { Component, JSX } from 'solid-js';

type BaseModalProps = {
  title: string
  children: JSX.Element
}

const BaseModal: Component<BaseModalProps> = (props) => {
  return (
    <div class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">{props.title}</h3>
        {props.children}
      </div>
    </div>
  );
};

export default BaseModal;
