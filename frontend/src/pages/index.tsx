import { A } from '@solidjs/router';
import type { Component } from 'solid-js';

const Index: Component = () => {
  return (
    <div class="hero min-h-screen bg-base-200">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1 class="text-5xl font-bold">Note Mark</h1>
          <p class="py-6">Fancy tag line here.</p>
          <A href="/login" class="btn btn-primary">Login</A>
        </div>
      </div>
    </div>
  );
};

export default Index;
