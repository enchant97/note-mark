export enum SortChoice {
  NAME_ASC = "NAME_ASC",
  NAME_DEC = "NAME_DEC",
  MOD_TIME_ASC = "MOD_TIME_ASC",
  MOD_TIME_DEC = "MOD_TIME_DEC",
}

export default function SortSelect(props: {
  name: string,
  selected: SortChoice,
  onChange: (choice: SortChoice) => {},
}) {
  return (
    <select
      name={props.name}
      class="select select-sm"
      onchange={(ev) => props.onChange(SortChoice[ev.currentTarget.value])}
    >
      <option selected={props.selected === SortChoice.NAME_ASC} value={SortChoice.NAME_ASC}>Name (A to Z)</option>
      <option selected={props.selected === SortChoice.NAME_DEC} value={SortChoice.NAME_DEC}>Name (Z to A)</option>
      <option selected={props.selected === SortChoice.MOD_TIME_DEC} value={SortChoice.MOD_TIME_DEC}>Modified (latest first)</option>
      <option selected={props.selected === SortChoice.MOD_TIME_ASC} value={SortChoice.MOD_TIME_ASC}>Modified (oldest first)</option>
    </select >
  )
}
