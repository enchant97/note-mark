import { useNavigate } from '@solidjs/router';
/*
 * Can be used the same as `<Navigate />`,
 * however adds to the browser history
 */
export default function Redirect(props: { href: string }) {
  let navigate = useNavigate()
  navigate(props.href)
  return <></>
}
