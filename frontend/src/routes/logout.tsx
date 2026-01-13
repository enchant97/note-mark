import { createEffect, createResource, type Component } from 'solid-js';
import { useSession } from '~/contexts/SessionProvider';
import Api from '~/core/api';
import StorageHandler from '~/core/storage';

const Logout: Component = () => {
  let { setIsAuthenticated } = useSession()
  const [doLogout] = createResource(Api.getLogout)
  createEffect(() => {
    if (!doLogout.loading) {
      setIsAuthenticated(false)
      StorageHandler.clearSettings()
    }
  })
  return <></>;
};

export default Logout;
