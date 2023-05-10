export type ApiDetails = {
    authToken?: string
    apiServer: string
}

class Api {
    private apiDetails: ApiDetails
    constructor(apiDetails: ApiDetails) {
        this.apiDetails = apiDetails
    }
    /**
     * allows for adjusting the main settings
     * without requiring a new object to be created.
     * @param apiDetails the new details
     * @returns self
     */
    setApi(apiDetails: ApiDetails): Api {
        this.apiDetails = apiDetails
        return this
    }
}

export default Api
