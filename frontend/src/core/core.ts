export type Option<V> = V | undefined

export class Fatal extends Error { }

export class Result<V, E extends Error> {
    readonly result: V | E
    constructor(result: V | E) {
        this.result = result
    }
    unwrap(): V {
        if (this.result instanceof Error) throw new Fatal("result contained an error type, failed to unwrap")
        return this.result
    }
    expect(message: string): V {
        if (this.result instanceof Error) throw new Fatal(message)
        return this.result
    }
    isOk(): boolean {
        return !(this.result instanceof Error)
    }
    isErr(): boolean {
        return this.result instanceof Error
    }
    intoOption(): Option<V> {
        if (this.result instanceof Error) return undefined
        return this.result
    }
}
