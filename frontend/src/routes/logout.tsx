import type { Component } from 'solid-js';
import StorageHandler from '~/core/storage';
import { useAuth } from '~/contexts/AuthProvider';

const Logout: Component = () => {
  let { setAuthStore } = useAuth()
  setAuthStore(null)
  StorageHandler.clearSettings()
  return <></>;
};

export default Logout;
