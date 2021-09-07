
const redis = require('./redis')

const { promisify } = require('util')
// Create new worker
const { StaticPool } = require('node-worker-threads-pool')
const config = require('./config')
if (config.test == true) {
  redis.select(1)
} else {
  redis.select(0)
}

const keyexist = promisify(redis.exists).bind(redis)
const flushdb = promisify(redis.flushdb).bind(redis)

fetchJsonPoll = new StaticPool({
  size: 1,
  task: './fetch_json_worker.js'
})

module.exports = {
  fetchJson

}

async function fetchJson () {
  const exists = await keyexist('grades:all')

  if (exists) return JSON.parse(exists)
  await flushdb()

  fetchJsonPoll.exec({ studentId: 'studentId' }).then(result => {
    return result
  })
}
