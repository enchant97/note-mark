import type { Component } from 'solid-js';
import { useApi } from '../contexts/ApiProvider';

const Logout: Component = () => {
  let { clearDetails } = useApi()
  clearDetails()
  return <></>;
};

export default Logout;
