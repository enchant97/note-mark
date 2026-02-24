export class Fatal extends Error { }

export type Option<T> = T | undefined

export function optionExpect<T>(v: Option<T>, message: string): T {
  if (v === undefined) throw new Fatal(message)
  return v
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
