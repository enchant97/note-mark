import { ParentProps } from "solid-js";
import Header from '~/components/Header';

export default function MainApp({ children }: ParentProps) {
  return (
    <>
      <Header />
      {children}
    </>
  )
}
