import { Book, CreateBook, CreateNote, CreateUser, Note, NoteAsset, OAuth2AccessTokenRequest, ServerInfo, UpdateBook, UpdateNote, UpdateUser, UpdateUserPassword, User, ValueWithSlug } from "~/core/types"

export enum HttpMethods {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

/**
 * HTTP status codes that are errors (>= 400),
 * including error code 0 (connection error for js)
 */
export enum HttpErrors {
  BodyError = -1,
  NetworkError = 0,

  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  Conflict = 409,
  PreconditionFailed = 412,

  InternalServerError = 500,
}

const HEADER_JSON = { "Content-Type": "application/json" }

export class ApiError extends Error {
  readonly status: number | HttpErrors
  constructor(status: number | HttpErrors, message?: string, options?: ErrorOptions) {
    super(message, options)
    this.status = status
  }
}

async function throwResponseApiErrors(v: Response) {
  if (!v.ok) {
    if (v.headers.get("Content-Type") === "application/problem+json") {
      if (v.status === 412) {
        throw new ApiError(v.status, "Possible resource conflict detected (server version ahead of clients)")
      }
      throw new ApiError(v.status, (await v.json()).detail)
    } else {
      throw new ApiError(v.status)
    }
  }
}

const ApiServerBaseUrl = (new URL("/api", import.meta.env.VITE_BACKEND_URL || window.location.origin)).toString()

/**
 * @throws {ApiError}
 */
async function apiFetch(url: string, init?: RequestInit) {
  let reqURL = `${ApiServerBaseUrl}/${url}`
  try {
    let resp = await fetch(reqURL, { credentials: "include", ...init })
    return resp
  } catch (err) {
    throw new ApiError(HttpErrors.NetworkError, undefined, { cause: err })
  }
}

class Api {
  //
  // Server
  //
  /**
   * @throws {ApiError}
   */
  static async getServerInfo(): Promise<ServerInfo> {
    let resp = await apiFetch("info")
    await throwResponseApiErrors(resp)
    return await resp.json()
  }
  //
  // Authentication
  //
  static async postToken(details: OAuth2AccessTokenRequest) {
    let resp = await apiFetch("auth/token", {
      method: HttpMethods.POST,
      headers: HEADER_JSON,
      body: JSON.stringify(details),
    })
    await throwResponseApiErrors(resp)
  }
  static async postTokenPasswordFlow(username: string, password: string) {
    return await Api.postToken({ grant_type: "password", username, password })
  }
  static async postExchangeOidcToken(
    accessToken: string,
    idToken: string,
  ) {
    let resp = await apiFetch("auth/oidc-exchange", {
      method: HttpMethods.POST,
      body: JSON.stringify({ accessToken, idToken }),
      headers: HEADER_JSON,
    })
    await throwResponseApiErrors(resp)
  }
  static async getAmIAuthenticated(): Promise<boolean> {
    let resp = await apiFetch("auth/am-i-authenticated", {
      method: HttpMethods.GET,
      headers: HEADER_JSON,
    })
    await throwResponseApiErrors(resp)
    return await resp.json()
  }
  static async getLogout() {
    let resp = await apiFetch("auth/logout", {
      method: HttpMethods.GET,
    })
    await throwResponseApiErrors(resp)
  }
  //
  // User
  //
  static async createUser(user: CreateUser): Promise<User> {
    let resp = await apiFetch("users", {
      method: HttpMethods.POST,
      body: JSON.stringify(user),
      headers: HEADER_JSON,
    })
    await throwResponseApiErrors(resp)
    return await resp.json()
  }
  /**
   * @throws {ApiError}
   */
  static async getUsersMe(): Promise<User> {
    let resp = await apiFetch("users/me", {
    })
    await throwResponseApiErrors(resp)
    return resp.json()
  }
  static async getUsersSearch(username: string): Promise<string[]> {
    let reqURL = `users/search?username=${username}`
    let resp = await apiFetch(reqURL)
    await throwResponseApiErrors(resp)
    return await resp.json()
  }
  static async updateUser(user: UpdateUser) {
    let resp = await apiFetch("users/me", {
      method: HttpMethods.PUT,
      headers: HEADER_JSON,
      body: JSON.stringify(user),
    })
    await throwResponseApiErrors(resp)
  }
  static async updateUserPassword(details: UpdateUserPassword) {
    let resp = await apiFetch("users/me/password", {
      method: HttpMethods.PUT,
      headers: HEADER_JSON,
      body: JSON.stringify(details),
    })
    await throwResponseApiErrors(resp)
  }
  //
  // Book
  //
  static async createBook(book: CreateBook): Promise<Book> {
    let resp = await apiFetch("books", {
      method: HttpMethods.POST,
      headers: HEADER_JSON,
      body: JSON.stringify(book),
    })
    await throwResponseApiErrors(resp)
    return await resp.json()
  }
  static async updateBook(bookId: string, book: UpdateBook) {
    let reqURL = `books/${bookId}`
    let resp = await apiFetch(reqURL, {
      method: HttpMethods.PUT,
      headers: HEADER_JSON,
      body: JSON.stringify(book),
    })
    await throwResponseApiErrors(resp)
  }
  static async deleteBook(bookId: string) {
    let reqURL = `books/${bookId}`
    let resp = await apiFetch(reqURL, {
      method: HttpMethods.DELETE,
    })
    await throwResponseApiErrors(resp)
  }
  //
  // Note
  //
  static async createNote(bookId: string, note: CreateNote): Promise<Note> {
    let reqURL = `books/${bookId}/notes`
    let resp = await apiFetch(reqURL, {
      method: HttpMethods.POST,
      headers: HEADER_JSON,
      body: JSON.stringify(note),
    })
    await throwResponseApiErrors(resp)
    return await resp.json()
  }
  static async getNotesRecents(): Promise<ValueWithSlug<Note>[]> {
    let resp = await apiFetch("notes/recent")
    await throwResponseApiErrors(resp)
    return await resp.json()
  }
  static async getNotesByBookId(bookId: string, deleted: boolean = false): Promise<Note[]> {
    let reqURL = `books/${bookId}/notes`
    if (deleted === true) {
      reqURL += "?deleted=true"
    }
    let resp = await apiFetch(reqURL)
    await throwResponseApiErrors(resp)
    return await resp.json()
  }
  static async getNoteContentById(noteId: string): Promise<string> {
    let reqURL = `notes/${noteId}/content`
    let resp = await apiFetch(reqURL)
    await throwResponseApiErrors(resp)
    return await resp.text()
  }
  static async updateNote(noteId: string, book: UpdateNote) {
    let reqURL = `notes/${noteId}`
    let resp = await apiFetch(reqURL, {
      method: HttpMethods.PUT,
      headers: HEADER_JSON,
      body: JSON.stringify(book),
    })
    await throwResponseApiErrors(resp)
  }
  static async updateNoteContent(noteId: string, content: string, lastModified?: Date): Promise<Date> {
    let reqURL = `notes/${noteId}/content`
    let headers = {}
    if (lastModified) {
      headers["If-Unmodified-Since"] = lastModified.toUTCString()
    }
    let resp = await apiFetch(reqURL, {
      method: HttpMethods.PUT,
      body: content,
      headers: headers,
    })
    await throwResponseApiErrors(resp)
    return new Date(resp.headers.get("Date") || new Date().toISOString())
  }
  static async restoreNoteById(noteId: string) {
    let reqURL = `notes/${noteId}/restore`
    let resp = await apiFetch(reqURL, {
      method: HttpMethods.PUT,
    })
    await throwResponseApiErrors(resp)
  }
  static async deleteNote(noteId: string, permanent: boolean = false) {
    let reqURL = `notes/${noteId}?permanent=${permanent}`
    let resp = await apiFetch(reqURL, {
      method: HttpMethods.DELETE,
    })
    await throwResponseApiErrors(resp)
  }
  //
  // Note Assets
  //
  static async createNoteAsset(noteId: string, file: File, name: string): Promise<NoteAsset> {
    let reqURL = `notes/${noteId}/assets`
    let resp = await apiFetch(reqURL, {
      method: HttpMethods.POST,
      headers: {
        "X-Name": name,
      },
      body: file,
    })
    await throwResponseApiErrors(resp)
    return await resp.json()
  }
  static getNoteAssetAccessUrl(noteId: string, assetId: string): string {
    return `${ApiServerBaseUrl}/notes/${noteId}/assets/${assetId}`
  }
  static async getNoteAssets(noteId: string): Promise<NoteAsset[]> {
    let reqURL = `notes/${noteId}/assets`
    let resp = await apiFetch(reqURL, {
      method: HttpMethods.GET,
    })
    await throwResponseApiErrors(resp)
    return await resp.json()
  }
  static async deleteNoteAsset(noteId: string, assetId: string) {
    let reqURL = `notes/${noteId}/assets/${assetId}`
    let resp = await apiFetch(reqURL, {
      method: HttpMethods.DELETE,
    })
    await throwResponseApiErrors(resp)
  }
  //
  // Slug Access
  //
  static async getUserByUsername(username: string, include?: "books" | "notes"): Promise<User> {
    let reqURL = `slug/${username}`
    if (include) { reqURL = `${reqURL}?include=${include}` }
    let resp = await apiFetch(reqURL)
    await throwResponseApiErrors(resp)
    return await resp.json()
  }
  static async getBookBySlug(username: string, bookSlug: string, include?: "notes"): Promise<Book> {
    let reqURL = `slug/${username}/books/${bookSlug}`
    if (include) { reqURL = `${reqURL}?include=${include}` }
    let resp = await apiFetch(reqURL)
    await throwResponseApiErrors(resp)
    return await resp.json()
  }
  static async getNoteBySlug(username: string, bookSlug: string, noteSlug: string): Promise<Note> {
    let reqURL = `slug/${username}/books/${bookSlug}/notes/${noteSlug}`
    let resp = await apiFetch(reqURL)
    await throwResponseApiErrors(resp)
    return await resp.json()
  }
}

export default Api
