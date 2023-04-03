const Express = require('express')
const AlgoliaSearch = require('algoliasearch')
const CatalystSDK = require('zcatalyst-sdk-node')

const AppConstants = require('./constants')
const { AuthService } = require('./services')
const { AppError, ErrorHandler } = require('./utils')

const app = Express()
app.use(Express.json())

app.use((req, res, next) => {
  try {
    if (
      !AuthService.getInstance().isValidRequest(
        req.get(AppConstants.Headers.CodelibSecretKey)
      )
    ) {
      throw new AppError(
        401,
        "You don't have permission to perform this operation. Kindly contact your administrator for more details."
      )
    }

    next()
  } catch (err) {
    const { statusCode, ...others } = ErrorHandler.getInstance().processError(err)

    res.status(statusCode).send(others)
  }
})

app.get('/search', async (req, res) => {
  try {
    const query = req.query.query
    const tableName = req.query.tableName

    if (!query) {
      throw new AppError(400, "'query' cannot be empty.")
    } else if (!tableName) {
      throw new AppError(400, "'tableName' cannot be empty.")
    }

    const algoliaAppId = process.env.ALGOLIA_APP_ID
    const algoliaAppKey = process.env.ALGOLIA_APP_KEY
    const algoliaInstance = AlgoliaSearch(algoliaAppId, algoliaAppKey)

    const index = algoliaInstance.initIndex(tableName)

    const data = await index.search(query)

    res.status(200).send({
      status: 'success',
      data
    })
  } catch (err) {
    const { statusCode, ...others } = ErrorHandler.getInstance().processError(err)

    res.status(statusCode).send(others)
  }
})

app.post('/row', async (req, res) => {
  try {
    const ROWID = req.body.ROWID
    const tableName = req.body.tableName

    if (!ROWID) {
      throw new AppError(400, "'ROWID' cannot be empty.")
    } else if (!tableName) {
      throw new AppError(400, "'tableName' cannot be empty.")
    }

    const algoliaAppId = process.env.ALGOLIA_APP_ID
    const algoliaAppKey = process.env.ALGOLIA_APP_KEY
    const algoliaInstance = AlgoliaSearch(algoliaAppId, algoliaAppKey)

    const catalyst = CatalystSDK.initialize(req)
    const zcql = catalyst.zcql()
    const index = algoliaInstance.initIndex(tableName)

    const data = await zcql
      .executeZCQLQuery(`SELECT * FROM ${tableName} WHERE ROWID = '${ROWID}'`)
      .then((records) => {
        if (records.length) {
          const { ROWID, ...others } = records[0][tableName]
          return {
            ROWID,
            ...others,
            objectID: ROWID
          }
        } else {
          throw new AppError(400, "No record found for the given 'ROWID'.")
        }
      })

    await index.saveObject(data)

    res.status(200).send({
      status: 'success',
      data: 'The given row has been successfully added to algolia.'
    })
  } catch (err) {
    const { statusCode, ...others } = ErrorHandler.getInstance().processError(err)

    res.status(statusCode).send(others)
  }
})

app.post('/bulkIndex', async (req, res) => {
  try {
    const tableName = req.body.tableName

    if (!tableName) {
      throw new AppError(400, "'tableName' cannot be empty.")
    }

    const catalyst = CatalystSDK.initialize(req)
    const zcql = catalyst.zcql()
    const segment = await catalyst
      .cache()
      .getSegmentDetails(AppConstants.CatalystComponents.Segment.Algolia)

    const isTableAlreadyIndexing = await segment
      .getValue(AppConstants.JobName + '_' + tableName)
      .then((value) => Boolean(value))

    if (isTableAlreadyIndexing) {
      throw new AppError(
        400,
        'The given table is currently being indexed in algolia.'
      )
    }

    const totalRecords = await zcql
      .executeZCQLQuery(`SELECT COUNT(ROWID) FROM ${tableName}`)
      .then((rows) => rows[0][tableName].ROWID)

    await segment.put(
      'Algolia_' + tableName,
      JSON.stringify({
        tableName,
        totalRecords
      })
    )

    res.status(200).send({
      status: 'success',
      response: 'The given table has been successfully scheduled for indexing in algolia'
    })
  } catch (err) {
    const { statusCode, ...others } = ErrorHandler.getInstance().processError(err)

    res.status(statusCode).send(others)
  }
})

app.all('*', function (_req, res) {
  res.status(404).send({
    status: 'failure',
    message: "We couldn't find the requested url."
  })
})

module.exports = app
