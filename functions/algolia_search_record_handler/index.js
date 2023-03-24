const AlgoliaSearch = require('algoliasearch')
const CatalystSDK = require('zcatalyst-sdk-node')

const AppConstants = require('./constants')

module.exports = async (event, context) => {
  try {
    const data = event.data
    const source = event.getSource()
    const action = event.getAction()
    const tableId = event.getSourceEntityId()
    const catalyst = CatalystSDK.initialize(context)

    if (source === 'Datastore') {
      const algoliaAppId = process.env[AppConstants.Env.AlgoliaAppId]
      const algoliaAppKey = process.env[AppConstants.Env.AlgoliaAppKey]
      const algoliaInstance = AlgoliaSearch(algoliaAppId, algoliaAppKey)
      const { table_name: tableName } = await catalyst
        .datastore()
        .getTableDetails(tableId)
        .then((response) => response.toJSON())

      const index = algoliaInstance.initIndex(tableName)

      if (action === 'Delete') {
        if (Array.isArray(data)) {
          index.deleteObjects(data.map((record) => record.ROWID))
        } else {
          index.deleteObject(data.ROWID)
        }
      } else {
        index.saveObjects(data.map(record => ({
          ...record,
          objectID: record.ROWID
        })))
      }
    }

    context.closeWithSuccess()
  } catch (err) {
    console.log(err)
    context.closeWithFailure()
  }
}
