const AlgoliaSearch = require('algoliasearch')
const CatalystSDK = require('zcatalyst-sdk-node')

const AppConstants = require('./constants.js')

module.exports = async (event, context) => {
  try {
    const data = event.data

    const catalyst = CatalystSDK.initialize(context)
    const zcql = catalyst.zcql()

    const segment = await catalyst
      .cache()
      .getSegmentDetails(AppConstants.CatalystComponents.Segment.Algolia)

    const algoliaAppId = process.env[AppConstants.Env.AlgoliaAppId]
    const algoliaAppKey = process.env[AppConstants.Env.AlgoliaAppKey]
    const algoliaInstance = AlgoliaSearch(algoliaAppId, algoliaAppKey)

    const { tableName, totalRecords } = JSON.parse(data.cache_value)

    const index = algoliaInstance.initIndex(tableName)

    const totalPages = Math.ceil(
      parseInt(totalRecords) / AppConstants.MaxRecords
    )

    for (let page = 1; page <= totalPages; page++) {
      const start = (page - 1) * AppConstants.MaxRecords + 1

      const records = await zcql
        .executeZCQLQuery(`SELECT * FROM ${tableName} LIMIT ${start},${AppConstants.MaxRecords}`)
        .then((records) =>
          records.map((record) => {
            const { ROWID, ...others } = record[tableName]

            return {
              ROWID,
              ...others,
              objectID: ROWID
            }
          })
        )

      await index.saveObjects(records)
    }
    await segment.delete(data.cache_name)
    context.closeWithSuccess()
  } catch (err) {
    console.log(err)
    context.closeWithFailure()
  }
}
