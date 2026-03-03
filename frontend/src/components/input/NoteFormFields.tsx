import { SetStoreFunction } from "solid-js/store";
import { toPathSlug, toSlug, toSlugWithSuffix } from "~/core/helpers";

interface Fields {
  title: string,
  slug: string,
  parentSlug: string,
}

export default function NoteFormFields(props: {
  fields: Fields,
  setFields: SetStoreFunction<Fields>,
}) {
  return (
    <>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Title</legend>
        <input
          class="input validator"
          value={props.fields.title}
          onInput={(ev) => props.setFields({
            title: ev.currentTarget.value,
            slug: toSlugWithSuffix(ev.currentTarget.value),
          })}
          name="title"
          type="text"
          placeholder="e.g. My Amazing Note"
          aria-label="title"
          required
        />
        <p class="label">The title of the note, human friendly.</p>
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Slug</legend>
        <input
          class="input validator"
          value={props.fields.slug}
          onInput={(ev) => props.setFields({
            slug: toSlug(ev.currentTarget.value),
          })}
          name="slug"
          type="text"
          placeholder="e.g. my-amazing-note"
          aria-label="slug"
          required
        />
        <p class="label">URL friendly name, will auto-generate based on title.</p>
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Path</legend>
        <span class="input validator">
          <input
            value={props.fields.parentSlug}
            onInput={(ev) => props.setFields({
              parentSlug: toPathSlug(ev.currentTarget.value),
            })}
            name="parentSlug"
            type="text"
            placeholder="e.g. some/path"
            aria-label="path"
          />
          <span class="label">{`/${props.fields.slug}`}</span>
        </span>
        <p class="label">Where note will be created, leave blank for placing at top level.</p>
      </fieldset>
    </>
  )
}
