import type { Component } from 'solid-js';
import BaseModal from './base';

type NewNoteModalProps = {
  onClose: () => void
}

const NewNoteModal: Component<NewNoteModalProps> = (props) => {
  return (
    <BaseModal title="Create Note">
      <div class="modal-action">
        <button onclick={props.onClose} class="btn btn-primary" type="button">Create</button>
        <button onclick={props.onClose} class="btn" type="button">Cancel</button>
      </div>
    </BaseModal>
  );
};

export default NewNoteModal;
