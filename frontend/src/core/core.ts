export class Fatal extends Error { }

export type Option<T> = T | undefined
export type Result<T, E extends Error> = T | E

export function resultExpect<T, E extends Error>(v: Result<T, E>, message: string): T {
    if (v instanceof Error) throw new Fatal(message)
    return v
}

export function resultUnwrap<T, E extends Error>(v: Result<T, E>): T {
    if (v instanceof Error) throw new Fatal("result contained an error type, failed to unwrap")
    return v
}

export function resultIntoOption<T, E extends Error>(v: Result<T, E>): Option<T> {
    if (v instanceof Error) return undefined
    return v
}

export function optionExpect<T>(v: Option<T>, message: string): T {
    if (v === undefined) throw new Fatal(message)
    return v
}

export function optionUnwrap<T>(v: T | undefined): T {
    if (v === undefined) throw new Fatal("result contained an option, failed to unwrap")
    return v
}
