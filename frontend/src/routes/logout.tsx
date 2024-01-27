import type { Component } from 'solid-js';
import { useApi } from '../contexts/ApiProvider';
import StorageHandler from '../core/storage';

const Logout: Component = () => {
  let { clearDetails } = useApi()
  clearDetails()
  StorageHandler.clearSettings()
  return <></>;
};

export default Logout;
