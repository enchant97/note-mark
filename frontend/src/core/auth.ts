export interface OpenIdUserInfoResponse {
  sub: string
  name?: string
  preferred_username: string
}

export interface OAuth2PasswordGrant {
  username: string
  password: string
}

export interface OAuth2TokenExchangeGrant {
  subject_token: string
  subject_token_type: "urn:ietf:params:oauth:token-type:access_token"
  actor_token?: string
  actor_token_type?: "urn:ietf:params:oauth:token-type:id_token"
}

export type OAuth2AccessTokenRequest = OAuth2PasswordGrant & {
  grant_type: "password"
} | OAuth2TokenExchangeGrant & {
  grant_type: "urn:ietf:params:oauth:grant-type:token-exchange"
}
