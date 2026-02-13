export interface Frontmatter {
  title: string
}

export enum NodeType {
  note = "note",
  asset = "asset",
}

export type NodeSlug = string
export type NodeTree = Record<NodeSlug, NodeTreeNode>

export interface NodeTreeNode extends Frontmatter {
  slug: NodeSlug
  type: string
  modTime: string
  children: NodeTree
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
