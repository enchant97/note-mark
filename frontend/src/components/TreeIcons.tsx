import Icon from "./icon"

export function FileIcon({ }) {
  return <Icon name={"file"} size={16} />
}

export function FolderIcon({ expand }) {
  return <Icon name={expand() ? "chevron-down" : "chevron-right"} size={16} />
}
