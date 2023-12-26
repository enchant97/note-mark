export type Breadcrumb = {
  username?: string
  bookSlug?: string
  noteSlug?: string
}

export type ServerInfo = {
  minSupportedVersion: string
  allowSignup: boolean
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

export type ValueWithSlug<T> = {
  value: T
  slug: string
}

export type FileInfo = {
  contentLength: number
  lastModified: string
  checksum: string
}

export type AssetFileInfo = FileInfo & {
  mimeType: string
}

export type User = {
  id: string
  username: string
  name?: string
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

export type NoteAsset = {
  id: string
  name: string
  createdAt: string
  info: AssetFileInfo
}

export type CreateUser = {
  username: string
  password: string
  name?: string
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

export type UpdateUser = {
  name?: string
}

export type UpdateUserPassword = {
  existingPassword: string
  newPassword: string
}

export type UpdateBook = {
  name?: string
  slug?: string
  isPublic?: boolean
}

export type UpdateNote = {
  name?: string
  slug?: string
}
