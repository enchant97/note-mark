const SLUG_SUFFIX_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789"
const SLUG_SUFFIX_LENGTH = 5;

export class Fatal extends Error { }

export type Option<T> = T | undefined

export function optionExpect<T>(v: Option<T>, message: string): T {
  if (v === undefined) throw new Fatal(message)
  return v
}

export function toSlug(v: string): string {
  return v.trim().replaceAll(/[^0-9a-zA-Z- _]/g, "")
}

export function toMachineSlug(v: string): string {
  return v.toLowerCase().replaceAll(" ", "-").replaceAll(/[^0-9a-z-_]/g, "")
}

export function toMachineSlugWithSuffix(v: string, suffixLength = SLUG_SUFFIX_LENGTH): string {
  let suffix = "-";
  for (let i = 0; i < suffixLength; i++) {
    suffix += SLUG_SUFFIX_CHARS[Math.floor(Math.random() * SLUG_SUFFIX_CHARS.length)]
  }
  return toMachineSlug(v) + suffix
}

export function toPathSlug(v: string): string {
  return v
    .trim()
    .replaceAll(/[^0-9a-zA-Z- _/]/g, "")
    .split("/")
    .filter((v) => v !== "")
    .join("/")
}

export function compare(a: any, b: any): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export class StringSource {
  readonly content: string
  readonly contentType: string
  constructor(content: string, contentType: string = "text/plain") {
    this.content = content
    this.contentType = contentType
  }
  blob() {
    return new Blob([this.content], { type: this.contentType })
  }
}

export function download(object: File | Blob | MediaSource | StringSource, filename: string) {
  if (object instanceof StringSource) { object = object.blob() }
  // NOTE: this should be garbage collected since it's not added to the DOM
  let a = window.document.createElement("a")
  a.href = URL.createObjectURL(object)
  a.download = filename
  a.click()
}

/*
 * copies given object to clipboard,
 * throws an `Error` with reason on failure
*/
export async function copyToClipboard(content: string) {
  if (!window.isSecureContext) {
    throw new Error("clipboard only available in secure contexts")
  }
  try {
    await navigator.clipboard.writeText(content);
  } catch (err) {
    console.error("failure to copy text to clipboard", err)
    throw new Error("unable to access clipboard, permission may not be granted?")
  }
}
