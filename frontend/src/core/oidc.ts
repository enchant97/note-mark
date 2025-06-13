import StorageHandler from "./storage"

const verificationSessionKey = "oidc_verification"

export interface OidcVerificationType {
  pkceCodeVerifier: string
  state: string
}

export class OidcVerification implements OidcVerificationType {
  pkceCodeVerifier: string
  state: string

  constructor(pkceCodeVerifier: string, state: string) {
    this.pkceCodeVerifier = pkceCodeVerifier
    this.state = state
  }
  save() {
    StorageHandler.writeSetting(verificationSessionKey, JSON.stringify(this))
  }
  static restore() {
    const savedRaw = StorageHandler.readSetting(verificationSessionKey)
    if (savedRaw === null) {
      return
    }
    StorageHandler.clearSetting(verificationSessionKey)
    const saved = JSON.parse(savedRaw) as OidcVerificationType
    return new OidcVerification(saved.pkceCodeVerifier, saved.state)
  }
}
