import { createEffect, createResource } from 'solid-js';
import { useSession } from '~/contexts/SessionProvider';
import Api from '~/core/api';
import StorageHandler from '~/core/storage';

export default function Logout() {
  let { clearUserInfo } = useSession()
  const [doLogout] = createResource(Api.authSessionEnd)
  createEffect(() => {
    if (!doLogout.loading) {
      clearUserInfo()
      StorageHandler.clearSettings()
    }
  })
  return <></>;
}
