import { Component } from 'solid-js';

const NoteViewEmpty: Component = () => {
  return (
    <div class="flex py-6">
      <div class="max-w-md mx-auto">
        <h1 class="text-5xl font-bold">Note Empty</h1>
        <p class="py-6">Switch to edit mode and start writing.</p>
      </div>
    </div>
  )
}

export default NoteViewEmpty;
