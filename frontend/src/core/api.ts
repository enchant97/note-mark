import { Result } from "~/core/core"
import { Book, CreateBook, CreateNote, CreateUser, Note, NoteAsset, OAuth2AccessToken, OAuth2AccessTokenRequest, ServerInfo, UpdateBook, UpdateNote, UpdateUser, UpdateUserPassword, User, ValueWithSlug } from "~/core/types"

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

async function handleFetchErrors(v: Promise<Response>): Promise<Result<Response, ApiError>> {
  try {
    return await v
  } catch (err) {
    return new ApiError(HttpErrors.NetworkError, undefined, { cause: err })
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

async function handleBodyErrors<T>(v: Promise<T>): Promise<Result<T, ApiError>> {
  try {
    return await v
  } catch (err) {
    return new ApiError(HttpErrors.BodyError, undefined, { cause: err })
  }
}

class Api {
  private apiServer: string
  private accessToken?: string
  constructor(apiToken?: string) {
    this.apiServer = (new URL("/api", import.meta.env.VITE_BACKEND_URL || window.location.origin)).toString()
    this.accessToken = apiToken
  }
  isAuthenticated(): boolean {
    return this.accessToken !== undefined
  }
  headerAuthorization(): Record<string, string> {
    return { "Authorization": `Bearer ${this.accessToken}` }
  }
  optionalHeaderAuthorization(): Record<string, string> {
    if (!this.isAuthenticated()) return {}
    return { "Authorization": `Bearer ${this.accessToken}` }
  }
  //
  // Server
  //
  async getServerInfo(): Promise<Result<ServerInfo, ApiError>> {
    let reqURL = `${this.apiServer}/info`
    let resp = await handleFetchErrors(fetch(reqURL))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return handleBodyErrors(resp.json())
  }
  //
  // Authentication
  //
  async postToken(details: OAuth2AccessTokenRequest): Promise<Result<OAuth2AccessToken, ApiError>> {
    let reqURL = `${this.apiServer}/auth/token`
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.POST,
      headers: HEADER_JSON,
      body: JSON.stringify(details),
    }))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return handleBodyErrors(resp.json())
  }
  async postTokenPasswordFlow(username: string, password: string): Promise<Result<OAuth2AccessToken, ApiError>> {
    return await this.postToken({ grant_type: "password", username, password })
  }
  async postExchangeOidcToken(
    oidcAccessToken: OAuth2AccessToken,
    usernameHint: string,
  ): Promise<OAuth2AccessToken> {
    let reqURL = `${this.apiServer}/auth/oidc-exchange`
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.POST,
      body: JSON.stringify(oidcAccessToken),
      headers: {
        "Username-Hint": usernameHint,
        ...HEADER_JSON,
      },
    }))
    if (resp instanceof Error) { throw resp }
    await throwResponseApiErrors(resp)
    return handleBodyErrors(resp.json())
  }
  //
  // User
  //
  async createUser(user: CreateUser): Promise<Result<User, ApiError>> {
    let reqURL = `${this.apiServer}/users`
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.POST,
      body: JSON.stringify(user),
      headers: HEADER_JSON,
    }))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return handleBodyErrors(resp.json())
  }
  async getUsersMe(): Promise<Result<User, ApiError>> {
    let reqURL = `${this.apiServer}/users/me`
    let resp = await handleFetchErrors(fetch(reqURL, {
      headers: this.headerAuthorization(),
    }))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return handleBodyErrors(resp.json())
  }
  async getUsersSearch(username: string): Promise<Result<string[], ApiError>> {
    let reqURL = `${this.apiServer}/users/search?username=${username}`
    let resp = await handleFetchErrors(fetch(reqURL))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return handleBodyErrors(resp.json())
  }
  async updateUser(user: UpdateUser): Promise<Result<undefined, ApiError>> {
    let reqURL = `${this.apiServer}/users/me`
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.PUT,
      headers: {
        ...HEADER_JSON,
        ...this.headerAuthorization(),
      },
      body: JSON.stringify(user),
    }))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return undefined
  }
  async updateUserPassword(details: UpdateUserPassword): Promise<Result<undefined, ApiError>> {
    let reqURL = `${this.apiServer}/users/me/password`
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.PUT,
      headers: {
        ...HEADER_JSON,
        ...this.headerAuthorization(),
      },
      body: JSON.stringify(details),
    }))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return undefined
  }
  //
  // Book
  //
  async createBook(book: CreateBook): Promise<Result<Book, ApiError>> {
    let reqURL = `${this.apiServer}/books`
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.POST,
      headers: {
        ...HEADER_JSON,
        ...this.headerAuthorization(),
      },
      body: JSON.stringify(book),
    }))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return handleBodyErrors(resp.json())
  }
  async updateBook(bookId: string, book: UpdateBook): Promise<Result<undefined, ApiError>> {
    let reqURL = `${this.apiServer}/books/${bookId}`
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.PUT,
      headers: {
        ...HEADER_JSON,
        ...this.headerAuthorization(),
      },
      body: JSON.stringify(book),
    }))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return undefined
  }
  async deleteBook(bookId: string): Promise<Result<undefined, ApiError>> {
    let reqURL = `${this.apiServer}/books/${bookId}`
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.DELETE,
      headers: this.headerAuthorization(),
    }))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return undefined
  }
  //
  // Note
  //
  async createNote(bookId: string, note: CreateNote): Promise<Result<Note, ApiError>> {
    let reqURL = `${this.apiServer}/books/${bookId}/notes`
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.POST,
      headers: {
        ...HEADER_JSON,
        ...this.headerAuthorization(),
      },
      body: JSON.stringify(note),
    }))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return handleBodyErrors(resp.json())
  }
  async getNotesRecents(): Promise<Result<ValueWithSlug<Note>[], ApiError>> {
    let reqURL = `${this.apiServer}/notes/recent`
    let resp = await handleFetchErrors(fetch(reqURL, {
      headers: this.optionalHeaderAuthorization(),
    }))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return handleBodyErrors(resp.json())
  }
  async getNotesByBookId(bookId: string, deleted: boolean = false): Promise<Result<Note[], ApiError>> {
    let reqURL = `${this.apiServer}/books/${bookId}/notes`
    if (deleted === true) {
      reqURL += "?deleted=true"
    }
    let resp = await handleFetchErrors(fetch(reqURL, {
      headers: this.optionalHeaderAuthorization(),
    }))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return handleBodyErrors(resp.json())
  }
  async getNoteContentById(noteId: string): Promise<Result<string, ApiError>> {
    let reqURL = `${this.apiServer}/notes/${noteId}/content`
    let resp = await handleFetchErrors(fetch(reqURL, {
      headers: this.optionalHeaderAuthorization(),
    }))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return handleBodyErrors(resp.text())
  }
  async updateNote(noteId: string, book: UpdateNote): Promise<Result<undefined, ApiError>> {
    let reqURL = `${this.apiServer}/notes/${noteId}`
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.PUT,
      headers: {
        ...HEADER_JSON,
        ...this.headerAuthorization(),
      },
      body: JSON.stringify(book),
    }))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return undefined
  }
  async updateNoteContent(noteId: string, content: string, lastModified?: Date): Promise<Result<Date, ApiError>> {
    let reqURL = `${this.apiServer}/notes/${noteId}/content`
    let headers = {
      ...this.headerAuthorization(),
    }
    if (lastModified) {
      headers["If-Unmodified-Since"] = lastModified.toUTCString()
    }
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.PUT,
      body: content,
      headers: headers,
    }))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return new Date(resp.headers.get("Date") || new Date().toISOString())
  }
  async restoreNoteById(noteId: string): Promise<Result<undefined, ApiError>> {
    let reqURL = `${this.apiServer}/notes/${noteId}/restore`
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.PUT,
      headers: this.headerAuthorization(),
    }))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return undefined
  }
  async deleteNote(noteId: string, permanent: boolean = false): Promise<Result<undefined, ApiError>> {
    let reqURL = `${this.apiServer}/notes/${noteId}?permanent=${permanent}`
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.DELETE,
      headers: this.headerAuthorization(),
    }))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return undefined
  }
  //
  // Note Assets
  //
  async createNoteAsset(noteId: string, file: File, name: string): Promise<Result<NoteAsset, ApiError>> {
    let reqURL = `${this.apiServer}/notes/${noteId}/assets`
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.POST,
      headers: {
        ...this.headerAuthorization(),
        "X-Name": name,
      },
      body: file,
    }))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return handleBodyErrors(resp.json())
  }
  getNoteAssetAccessUrl(noteId: string, assetId: string): string {
    return `${this.apiServer}/notes/${noteId}/assets/${assetId}`
  }
  async getNoteAssets(noteId: string): Promise<Result<NoteAsset[], ApiError>> {
    let reqURL = `${this.apiServer}/notes/${noteId}/assets`
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.GET,
      headers: {
        ...this.optionalHeaderAuthorization(),
      },
    }))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return handleBodyErrors(resp.json())
  }
  async deleteNoteAsset(noteId: string, assetId: string): Promise<Result<undefined, ApiError>> {
    let reqURL = `${this.apiServer}/notes/${noteId}/assets/${assetId}`
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.DELETE,
      headers: this.headerAuthorization(),
    }))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return undefined
  }
  //
  // Slug Access
  //
  async getUserByUsername(username: string, include?: "books" | "notes"): Promise<Result<User, ApiError>> {
    let reqURL = `${this.apiServer}/slug/${username}`
    if (include) { reqURL = `${reqURL}?include=${include}` }
    let resp = await handleFetchErrors(fetch(reqURL, {
      headers: this.optionalHeaderAuthorization(),
    }))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return handleBodyErrors(resp.json())
  }
  async getBookBySlug(username: string, bookSlug: string, include?: "notes"): Promise<Result<Book, ApiError>> {
    let reqURL = `${this.apiServer}/slug/${username}/books/${bookSlug}`
    if (include) { reqURL = `${reqURL}?include=${include}` }
    let resp = await handleFetchErrors(fetch(reqURL, {
      headers: this.optionalHeaderAuthorization(),
    }))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return handleBodyErrors(resp.json())
  }
  async getNoteBySlug(username: string, bookSlug: string, noteSlug: string): Promise<Result<Note, ApiError>> {
    let reqURL = `${this.apiServer}/slug/${username}/books/${bookSlug}/notes/${noteSlug}`
    let resp = await handleFetchErrors(fetch(reqURL, {
      headers: this.optionalHeaderAuthorization(),
    }))
    if (resp instanceof Error) return resp
    try {
      await throwResponseApiErrors(resp)
    } catch (e) {
      return e
    }
    return handleBodyErrors(resp.json())
  }
}

export default Api
