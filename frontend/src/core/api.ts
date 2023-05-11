import { Result } from "./core"
import { OAuth2AccessToken, OAuth2AccessTokenRequest } from "./types"

export type ApiDetails = {
    authToken?: string
    apiServer: string
}

export class ApiError extends Error {
    readonly status: number
    constructor(status: number, message?: string) {
        super(message)
        this.status = status
    }
}

class Api {
    private authToken?: string
    private apiServer: string
    constructor(apiDetails: ApiDetails) {
        this.authToken = apiDetails.authToken
        this.apiServer = apiDetails.apiServer
    }
    /**
     * allows for adjusting the main settings
     * without requiring a new object to be created.
     * @param apiDetails the new details
     * @returns self
     */
    setApi(apiDetails: ApiDetails): Api {
        this.authToken = apiDetails.authToken
        this.apiServer = apiDetails.apiServer
        return this
    }
    async postToken(details: OAuth2AccessTokenRequest): Promise<Result<OAuth2AccessToken, ApiError>> {
        let reqURL = `${this.apiServer}/auth/token`
        let resp = await fetch(reqURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(details)
        })
        if (!resp.ok) return new Result<OAuth2AccessToken, ApiError>(new ApiError(resp.status))
        return new Result(await resp.json())
    }
    async postTokenPasswordFlow(username: string, password: string): Promise<Result<OAuth2AccessToken, ApiError>> {
        return await this.postToken({ grant_type: "password", username, password })
    }
}

export default Api
