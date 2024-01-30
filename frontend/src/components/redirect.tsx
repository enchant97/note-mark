import { useNavigate } from '@solidjs/router';

export type RedirectProps = {
  href: string
}

/*
 * Can be used the same as `<Navigate />`,
 * however adds to the browser history
 */
export default function Redirect(props: RedirectProps) {
  let navigate = useNavigate()
  navigate(props.href)
  return <></>
}
