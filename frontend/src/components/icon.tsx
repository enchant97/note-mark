import { Component, JSX } from "solid-js";
import feather from 'feather-icons';

const ICON_SIZE_DEFAULT = 20

type IconProps = {
  name: string
  size?: number
  class?: string
} & JSX.SvgSVGAttributes<SVGSVGElement>

const Icon: Component<IconProps> = ({ name, size, class: className, ...props }) => {
  return (
    <svg
      width={size || ICON_SIZE_DEFAULT}
      height={size || ICON_SIZE_DEFAULT}
      fill="none"
      stroke="currentColor"
      stroke-width={"2"}
      stroke-linecap="round"
      stroke-linejoin="round"
      viewBox="0 0 24 24"
      innerHTML={feather.icons[name].contents}
      class={className}
      {...props}
    />
  )
}

export default Icon
