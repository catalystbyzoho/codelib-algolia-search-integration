const AppConstants = require('../constants')
class AuthService {
  #DefaultKey = 'CODEDECK-FAKE-KEY'

  isValidRequest = (key) => {
    return key && key !== this.#DefaultKey && key === process.env[AppConstants.Env.CodelibSecretKey]
  }

  static getInstance = () => {
    return new AuthService()
  }
}
module.exports = AuthService
