import type { Component } from 'solid-js';
import { useCurrentUser } from '../contexts/CurrentUserProvider';

const Profile: Component = () => {
  const user = useCurrentUser()

  return (
    <div class="bg-base-200 p-6 rounded-md">
      <h1 class="text-xl font-bold">My Profile</h1>
      <div>username: {user()?.username}</div>
      <div class="mb-2">full-name: {user()?.name || ""}</div>
      <div class="btn-group">
        <button class="btn btn-disabled">Update Profile</button>
        <button class="btn btn-disabled">Change Password</button>
      </div>
    </div>
  );
};

export default Profile;
