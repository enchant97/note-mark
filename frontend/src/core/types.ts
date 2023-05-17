export type Breadcrumb = {
    username?: string
    bookSlug?: string
    noteSlug?: string
}

export type OAuth2AccessTokenRequest = {
    grant_type: string
    username: string
    password: string
}

export type OAuth2AccessToken = {
    access_token: string
    token_type: string
    expires_in: number
}

export type User = {
    id: string
    username: string
}

export type Book = {
    id: string
    name: string
    slug: string
    ownerId: string
    isPublic: boolean
}

export type Note = {
    id: string
    name: string
    slug: string
    bookId: string
}

export type CreateBook = {
    name: string
    slug: string
    isPublic: boolean
}

export type CreateNote = {
    name: string
    slug: string
}

export type UpdateBook = {
    name?: string
    slug?: string
    isPublic?: boolean
}
