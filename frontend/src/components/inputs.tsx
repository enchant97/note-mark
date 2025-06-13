import { Component } from "solid-js";

export enum SortChoice {
  NAME_ASC = "NAME_ASC",
  NAME_DEC = "NAME_DEC",
  UPDATED_ASC = "UPDATED_ASC",
  UPDATED_DEC = "UPDATED_DEC",
  CREATED_ASC = "CREATED_ASC",
  CREATED_DEC = "CREATED_DEC",
}

type SortSelectProps = {
  name: string
  selected: SortChoice
  onChange: (choice: SortChoice) => {}
}

export const SortSelect: Component<SortSelectProps> = (props) => {
  return (
    <select
      name={props.name}
      class="select select-sm"
      onchange={(ev) => props.onChange(SortChoice[ev.currentTarget.value])}
    >
      <option selected={props.selected === SortChoice.NAME_ASC} value={SortChoice.NAME_ASC}>Name (A to Z)</option>
      <option selected={props.selected === SortChoice.NAME_DEC} value={SortChoice.NAME_DEC}>Name (Z to A)</option>
      <option selected={props.selected === SortChoice.UPDATED_DEC} value={SortChoice.UPDATED_DEC}>Modified (latest first)</option>
      <option selected={props.selected === SortChoice.UPDATED_ASC} value={SortChoice.UPDATED_ASC}>Modified (oldest first)</option>
      <option selected={props.selected === SortChoice.CREATED_DEC} value={SortChoice.CREATED_DEC}>Created (latest first)</option>
      <option selected={props.selected === SortChoice.CREATED_ASC} value={SortChoice.CREATED_ASC}>Created (oldest first)</option>
    </select >
  )
}
