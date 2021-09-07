const axios = require('axios')
const { Worker } = require('worker_threads')
const hyperquest = require('hyperquest')
const JSONStream = require('JSONStream')
const es = require('event-stream')
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
const redisMulti = redis.multi()
const execMultiAsync = promisify(redisMulti.exec).bind(redisMulti)
const keyexist = promisify(redis.exists).bind(redis)
const flushdb = promisify(redis.flushdb).bind(redis)
const get = promisify(redis.get).bind(redis)
// const pipeline =redis.pipeline();

const Grades = []
const courseListAll = []
const SumcourseListAll = []

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
