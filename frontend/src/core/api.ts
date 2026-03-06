import { OAuth2AccessTokenRequest, OpenIdUserInfoResponse } from "./auth"
import type { CreateUserWithPassword, Frontmatter, NodeTree, ServerInfo, UpdateUser, UpdateUserPassword, User } from "./types"

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
      // process RFC 9457 problem data
      throw new ApiError(v.status, (await v.json()).detail)
    } else {
      // process standard error codes
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

export default class Api {
  static async getServerInfo(): Promise<ServerInfo> {
    let resp = await apiFetch("info")
    await throwResponseApiErrors(resp)
    return await resp.json()
  }
  //
  // Session Authentication
  //
  static async authSessionStart(req: OAuth2AccessTokenRequest) {
    let resp = await apiFetch("auth/s/start", {
      method: HttpMethods.POST,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    })
    await throwResponseApiErrors(resp)
  }
  static async authSessionEnd() {
    let resp = await apiFetch("auth/s/end", {
      method: HttpMethods.DELETE,
    })
    await throwResponseApiErrors(resp)
  }
  static async authGetUserInfo(): Promise<OpenIdUserInfoResponse> {
    let resp = await apiFetch("auth/o/userinfo", {
      method: HttpMethods.GET,
    })
    await throwResponseApiErrors(resp)
    return await resp.json()
  }
  //
  // User
  //
  static async createUser(user: CreateUserWithPassword): Promise<User> {
    let resp = await apiFetch("users", {
      method: HttpMethods.POST,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    })
    await throwResponseApiErrors(resp)
    return await resp.json()
  }
  static async getUserByUsername(username: string): Promise<User> {
    let resp = await apiFetch(`users/${username}`, {
      method: HttpMethods.GET,
    })
    await throwResponseApiErrors(resp)
    return await resp.json()
  }
  static async searchForUsername(query: string): Promise<string[]> {
    let resp = await apiFetch(`users/search?username=${query}`, {
      method: HttpMethods.GET,
    })
    await throwResponseApiErrors(resp)
    return await resp.json()
  }
  static async updateUser(username: string, user: UpdateUser) {
    let resp = await apiFetch(`users/${username}`, {
      method: HttpMethods.PUT,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    })
    await throwResponseApiErrors(resp)
  }
  static async updateUserPassword(username: string, passwords: UpdateUserPassword) {
    let resp = await apiFetch(`users/${username}/password`, {
      method: HttpMethods.PUT,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(passwords),
    })
    await throwResponseApiErrors(resp)
  }
  //
  // Node Tree
  //
  static async getNodeTree(username: string): Promise<NodeTree> {
    let resp = await apiFetch(`tree/u/${username}`, {
      method: HttpMethods.GET,
    })
    await throwResponseApiErrors(resp)
    return await resp.json()
  }
  static async getNodeContent(username: string, slug: string): Promise<string | Blob> {
    let resp = await apiFetch(`tree/content/u/${username}/${slug}`, {
      method: HttpMethods.GET,
    })
    await throwResponseApiErrors(resp)
    if (resp.headers.get("Content-Type") === "text/markdown") {
      return await resp.text()
    }
    return await resp.blob()
  }
  static async updateNodeContent(username: string, slug: string, content: string | File) {
    let resp = await apiFetch(`tree/content/u/${username}/${slug}`, {
      method: HttpMethods.PUT,
      headers: {
        "Content-Type": content instanceof String ? "text/markdown" : (content.type || "application/octet-stream")
      },
      body: content,
    })
    await throwResponseApiErrors(resp)
  }
  static async updateNoteNodeFrontmatter(username: string, slug: string, frontmatter: Frontmatter) {
    let resp = await apiFetch(`tree/frontmatter/u/${username}/${slug}`, {
      method: HttpMethods.PUT,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(frontmatter),
    })
    await throwResponseApiErrors(resp)
  }
  static async renameNode(username: string, slug: string, newSlug: string) {
    let resp = await apiFetch(`tree/rename/u/${username}/${slug}`, {
      method: HttpMethods.POST,
      body: JSON.stringify(newSlug),
      headers: { "Content-Type": "application/json" },
    })
    await throwResponseApiErrors(resp)
  }
  static async moveNodeToTrash(username: string, slug: string) {
    let resp = await apiFetch(`tree/move-to-trash/u/${username}/${slug}`, {
      method: HttpMethods.POST,
    })
    await throwResponseApiErrors(resp)
  }
  static async deleteNode(username: string, slug: string) {
    let resp = await apiFetch(`tree/u/${username}/${slug}`, {
      method: HttpMethods.DELETE,
    })
    await throwResponseApiErrors(resp)
  }
}
