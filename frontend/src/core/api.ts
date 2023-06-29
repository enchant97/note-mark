import { Result } from "./core"
import { Book, CreateBook, CreateNote, CreateUser, Note, OAuth2AccessToken, OAuth2AccessTokenRequest, ServerInfo, UpdateBook, UpdateNote, UpdateUser, UpdateUserPassword, User } from "./types"

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

  InternalServerError = 500,
}

export type ApiHandlerConfig = {
  authToken?: string
  apiServer: string
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

async function handleBodyErrors<T>(v: Promise<T>): Promise<Result<T, ApiError>> {
  try {
    return await v
  } catch (err) {
    return new ApiError(HttpErrors.BodyError, undefined, { cause: err })
  }
}

class Api {
  private authToken?: string
  private apiServer: string
  constructor(apiDetails: ApiHandlerConfig) {
    this.authToken = apiDetails.authToken
    this.apiServer = apiDetails.apiServer
  }
  /**
   * allows for adjusting the main settings
   * without requiring a new object to be created.
   * @param apiDetails the new details
   * @returns self
   */
  setApi(apiDetails: ApiHandlerConfig): Api {
    this.authToken = apiDetails.authToken
    this.apiServer = apiDetails.apiServer
    return this
  }
  isAuthenticated(): boolean {
    return this.authToken !== undefined
  }
  headerAuthorization(): Record<string, string> {
    return { "Authorization": `Bearer ${this.authToken}` }
  }
  async getServerInfo(): Promise<Result<ServerInfo, ApiError>> {
    let reqURL = `${this.apiServer}/info`
    let resp = await handleFetchErrors(fetch(reqURL))
    if (resp instanceof Error) return resp
    if (!resp.ok) return new ApiError(resp.status)
    return handleBodyErrors(resp.json())
  }
  async postToken(details: OAuth2AccessTokenRequest): Promise<Result<OAuth2AccessToken, ApiError>> {
    let reqURL = `${this.apiServer}/auth/token`
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.POST,
      headers: HEADER_JSON,
      body: JSON.stringify(details),
    }))
    if (resp instanceof Error) return resp
    if (!resp.ok) return new ApiError(resp.status)
    return handleBodyErrors(resp.json())
  }
  async postTokenPasswordFlow(username: string, password: string): Promise<Result<OAuth2AccessToken, ApiError>> {
    return await this.postToken({ grant_type: "password", username, password })
  }
  async createUser(user: CreateUser): Promise<Result<User, ApiError>> {
    let reqURL = `${this.apiServer}/users`
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.POST,
      body: JSON.stringify(user),
      headers: HEADER_JSON,
    }))
    if (resp instanceof Error) return resp
    if (!resp.ok) return new ApiError(resp.status)
    return handleBodyErrors(resp.json())
  }
  async getUsersSearch(username: string): Promise<Result<string[], ApiError>> {
    let reqURL = `${this.apiServer}/users/search?username=${username}`
    let resp = await handleFetchErrors(fetch(reqURL))
    if (resp instanceof Error) return resp
    if (!resp.ok) return new ApiError(resp.status)
    return handleBodyErrors(resp.json())
  }
  async getUsersMe(): Promise<Result<User, ApiError>> {
    let reqURL = `${this.apiServer}/users/me`
    let resp = await handleFetchErrors(fetch(reqURL, {
      headers: this.headerAuthorization(),
    }))
    if (resp instanceof Error) return resp
    if (!resp.ok) return new ApiError(resp.status)
    return handleBodyErrors(resp.json())
  }
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
    if (!resp.ok) return new ApiError(resp.status)
    return handleBodyErrors(resp.json())
  }
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
    if (!resp.ok) return new ApiError(resp.status)
    return handleBodyErrors(resp.json())
  }
  async getBooksBySlug(username: string): Promise<Result<Book[], ApiError>> {
    let reqURL = `${this.apiServer}/slug/@${username}/books`
    let resp = await handleFetchErrors(fetch(reqURL, {
      headers: this.headerAuthorization(),
    }))
    if (resp instanceof Error) return resp
    if (!resp.ok) return new ApiError(resp.status)
    return handleBodyErrors(resp.json())
  }
  async getBookBySlug(username: string, bookSlug: string): Promise<Result<Book, ApiError>> {
    let reqURL = `${this.apiServer}/slug/@${username}/books/${bookSlug}`
    let resp = await handleFetchErrors(fetch(reqURL, {
      headers: this.headerAuthorization(),
    }))
    if (resp instanceof Error) return resp
    if (!resp.ok) return new ApiError(resp.status)
    return handleBodyErrors(resp.json())
  }
  async getNotesBySlug(username: string, bookSlug: string): Promise<Result<Note[], ApiError>> {
    let reqURL = `${this.apiServer}/slug/@${username}/books/${bookSlug}/notes`
    let resp = await handleFetchErrors(fetch(reqURL, {
      headers: this.headerAuthorization(),
    }))
    if (resp instanceof Error) return resp
    if (!resp.ok) return new ApiError(resp.status)
    return handleBodyErrors(resp.json())
  }
  async getNoteBySlug(username: string, bookSlug: string, noteSlug: string): Promise<Result<Note, ApiError>> {
    let reqURL = `${this.apiServer}/slug/@${username}/books/${bookSlug}/notes/${noteSlug}`
    let resp = await handleFetchErrors(fetch(reqURL, {
      headers: this.headerAuthorization(),
    }))
    if (resp instanceof Error) return resp
    if (!resp.ok) return new ApiError(resp.status)
    return handleBodyErrors(resp.json())
  }
  async getNoteContentById(noteId: string): Promise<Result<string, ApiError>> {
    let reqURL = `${this.apiServer}/notes/${noteId}/content`
    let resp = await handleFetchErrors(fetch(reqURL, {
      headers: this.headerAuthorization(),
    }))
    if (resp instanceof Error) return resp
    if (!resp.ok) return new ApiError(resp.status)
    return handleBodyErrors(resp.text())
  }
  async updateBook(bookId: string, book: UpdateBook): Promise<Result<undefined, ApiError>> {
    let reqURL = `${this.apiServer}/books/${bookId}`
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.PATCH,
      headers: {
        ...HEADER_JSON,
        ...this.headerAuthorization(),
      },
      body: JSON.stringify(book),
    }))
    if (resp instanceof Error) return resp
    if (!resp.ok) return new ApiError(resp.status)
    return undefined
  }
  async updateUser(user: UpdateUser): Promise<Result<undefined, ApiError>> {
    let reqURL = `${this.apiServer}/users/me`
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.PATCH,
      headers: {
        ...HEADER_JSON,
        ...this.headerAuthorization(),
      },
      body: JSON.stringify(user),
    }))
    if (resp instanceof Error) return resp
    if (!resp.ok) return new ApiError(resp.status)
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
    if (!resp.ok) return new ApiError(resp.status)
    return undefined
  }
  async updateNote(noteId: string, book: UpdateNote): Promise<Result<undefined, ApiError>> {
    let reqURL = `${this.apiServer}/notes/${noteId}`
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.PATCH,
      headers: {
        ...HEADER_JSON,
        ...this.headerAuthorization(),
      },
      body: JSON.stringify(book),
    }))
    if (resp instanceof Error) return resp
    if (!resp.ok) return new ApiError(resp.status)
    return undefined
  }
  async updateNoteContent(noteId: string, content: string): Promise<Result<undefined, ApiError>> {
    let reqURL = `${this.apiServer}/notes/${noteId}/content`
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.PUT,
      body: content,
      headers: this.headerAuthorization(),
    }))
    if (resp instanceof Error) return resp
    if (!resp.ok) return new ApiError(resp.status)
    return undefined
  }
  async deleteBook(bookId: string, permanent: boolean = false): Promise<Result<undefined, ApiError>> {
    let reqURL = `${this.apiServer}/books/${bookId}?permanent=${permanent}`
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.DELETE,
      headers: this.headerAuthorization(),
    }))
    if (resp instanceof Error) return resp
    if (!resp.ok) return new ApiError(resp.status)
    return undefined
  }
  async deleteNote(noteId: string, permanent: boolean = false): Promise<Result<undefined, ApiError>> {
    let reqURL = `${this.apiServer}/notes/${noteId}?permanent=${permanent}`
    let resp = await handleFetchErrors(fetch(reqURL, {
      method: HttpMethods.DELETE,
      headers: this.headerAuthorization(),
    }))
    if (resp instanceof Error) return resp
    if (!resp.ok) return new ApiError(resp.status)
    return undefined
  }
}

export default Api
