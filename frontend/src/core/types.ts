export type Username = string

export type AccessControlMode = "read" | "write"

export type AccessControlUsers = Record<Username, AccessControlMode>

export interface AccessControl {
  publicRead: boolean
  users?: AccessControlUsers
}

export interface Frontmatter {
  title?: string
  accessControl?: AccessControl
}

export enum NodeType {
  note = "note",
  asset = "asset",
}

export type NodeSlug = string
export type NodeTree = Record<NodeSlug, NodeTreeNode>

export type NodeTreeNode = {
  slug: NodeSlug
  modTime: string // TODO extend from ModTime instead
} & ({
  type: "note"
  frontmatter: Frontmatter
  children: NodeTree
} | {
  type: "asset"
})

export interface NodeEntry {
  fullSlug: string
  nodeType: "note" | "asset"
  modTime: string
  frontmatter?: Frontmatter
}

export interface OidcProviderInfo {
  displayName: string
  issuerUrl: string
  clientId: string
}

export interface ServerInfo {
  minSupportedVersion: string
  allowInternalSignup: boolean
  allowInternalLogin: boolean
  enableAnonymousUserSearch: boolean
  oidcProvider?: OidcProviderInfo
}

export interface CreateUserWithPassword {
  username: string
  name?: string
  password: string
}

export interface UpdateUser {
  name: string | null
}

export interface UpdateUserPassword {
  existingPassword: string
  newPassword: string
}

export interface ModTime {
  createdAt: string
  updatedAt: string
}

export interface User extends ModTime {
  uid: string
  username: string
  name?: string
}
