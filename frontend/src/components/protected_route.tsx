import { Component, JSX, Show } from 'solid-js';
import Redirect from './redirect';
import { Route } from '@solidjs/router';

export type ProtectedRouteProps = {
  path: string
  redirectPath: string
  condition: () => boolean
  children?: JSX.Element
} & ({
  element?: never
  component?: Component
} | {
  element?: JSX.Element
  component?: never
})

const ProtectedRoute: Component<ProtectedRouteProps> = (props) => {
  return (
    <Route path={props.path} element={
      <Show when={props.condition()} fallback={<Redirect to={props.redirectPath} />}>
        {props.component !== undefined && <props.component />}
        {props.element !== undefined && props.element}
      </Show>}>{props.children}</Route>
  )
}

export default ProtectedRoute;
