export type Breadcrumb = {
  username?: string
  bookSlug?: string
  noteSlug?: string
}

export type BreadcrumbWithNames = Breadcrumb & {
  fullName?: string
  bookName?: string
  noteName?: string
}

export interface OidcProviderInfo {
  displayName: string
  issuerUrl: string
  clientId: string
}

export type ServerInfo = {
  minSupportedVersion: string
  allowInternalSignup: boolean
  allowInternalLogin: boolean
  enableAnonymousUserSearch: boolean
  oidcProvider?: OidcProviderInfo
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

export type ModificationRecord = {
  createdAt: string,
  updatedAt: string,
  deletedAt?: string,
}

export type User = ModificationRecord & {
  id: string
  username: string
  name?: string

  books?: Book[]
}

export type Book = ModificationRecord & {
  id: string
  name: string
  slug: string
  ownerId: string
  isPublic: boolean

  notes?: Note[]
}

export type Note = ModificationRecord & {
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
  name: string
  slug: string
  isPublic: boolean
}

export type UpdateNote = {
  name: string
  slug: string
}

export function bookIntoUpdateBook(book: Book): UpdateBook {
  const { updatedAt: _, createdAt: _2, id: _3, deletedAt: _4, ownerId: _5, ...updateBook } = book
  return updateBook
}

export function noteIntoUpdateNote(note: Note): UpdateNote {
  const { updatedAt: _, createdAt: _2, id: _3, deletedAt: _4, bookId: _5, ...updateNote } = note
  return updateNote
}

export function userIntoUpdateUser(user: User): UpdateUser {
  const { updatedAt: _, createdAt: _2, id: _3, deletedAt: _4, username: _5, ...updateUser } = user
  return updateUser
}
