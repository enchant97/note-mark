export default function AlertBox(props: {
  content: string | Error,
  level?: "info" | "success" | "warning" | "error"
}) {
  return (
    // class="alert-info alert-success alert-warning alert-error"
    <div role="alert" class={`alert alert-${props.level || "info"} alert-soft shadow-glass`}>
      <span>
        {props.content instanceof Error
          ? props.content.message
          : props.content}
      </span>
    </div>
  )
}
