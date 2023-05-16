import type { Component } from 'solid-js';
import BaseModal from './base';

type NewBookModalProps = {
  onClose: () => void
}

const NewBookModal: Component<NewBookModalProps> = (props) => {
  return (
    <BaseModal title="Create Book">
      <div class="modal-action">
        <button onclick={props.onClose} class="btn btn-primary" type="button">Create</button>
        <button onclick={props.onClose} class="btn" type="button">Cancel</button>
      </div>
    </BaseModal>
  );
};

export default NewBookModal;
