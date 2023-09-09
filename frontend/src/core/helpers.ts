const SLUG_SUFFIX_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789"
const SLUG_SUFFIX_LENGTH = 5;

export function toSlug(v: string): string {
  return v.toLowerCase().replaceAll(" ", "-").replaceAll(/[^a-z0-9-]/g, "")
}

export function toSlugWithSuffix(v: string, suffixLength = SLUG_SUFFIX_LENGTH): string {
  let suffix = "-";
  for (let i = 0; i < suffixLength; i++) {
    suffix += SLUG_SUFFIX_CHARS[Math.floor(Math.random() * SLUG_SUFFIX_CHARS.length)]
  }
  return toSlug(v) + suffix
}
