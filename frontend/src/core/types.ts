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
