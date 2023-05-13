import { useNavigate } from '@solidjs/router';
import { Component } from 'solid-js';

export type RedirectProps = {
  to: string
}

const Redirect: Component<RedirectProps> = (props) => {
  let navigate = useNavigate()
  navigate(props.to)
  return <></>
}

export default Redirect;
