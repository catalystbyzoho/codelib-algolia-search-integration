class AppConstants {
  static Headers = {
    CodelibSecretKey: 'x-codelib-secret-key'
  }

  static Env = {
    AlgoliaAppId: 'ALGOLIA_APP_ID',
    AlgoliaApiKey: 'ALGOLIA_API_KEY',
    CodelibSecretKey: 'CODELIB_SECRET_KEY'
  }

  static JobName = 'Algolia'
  static CatalystComponents = {
    Segment: {
      Algolia: 'Algolia'
    }
  }
}

module.exports = AppConstants
