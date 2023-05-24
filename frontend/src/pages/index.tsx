import { A } from '@solidjs/router';
import { Component } from 'solid-js';
import { useApi } from '../contexts/ApiProvider';
import { useCurrentUser } from '../contexts/CurrentUserProvider';

const Index: Component = () => {
  const { apiDetails } = useApi()
  const user = useCurrentUser()

  return (
    <div class="hero bg-base-200 pt-6 pb-6">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1 class="text-5xl font-bold">Note Mark</h1>
          <p class="py-6">Fancy tag line here.</p>
          <div class="btn-group">
            {!apiDetails().authToken && <A href="/login" class="btn btn-outline">Login</A>}
            {user() && <A class="btn btn-outline" href={`/${user()?.username}`}>My Notes</A>}
            <button class="btn btn-outline btn-disabled" type="button">Find User</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
