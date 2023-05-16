export function toSlug(v: string): string {
    return v.toLowerCase().replaceAll(" ", "-").replaceAll(/[^a-z0-9-]/g, "")
}
