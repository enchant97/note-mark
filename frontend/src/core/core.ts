export class Fatal extends Error { }

export type Option<T> = T | undefined

export function optionExpect<T>(v: Option<T>, message: string): T {
  if (v === undefined) throw new Fatal(message)
  return v
}
