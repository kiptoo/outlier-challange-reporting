// add this script in myWorker.js file
const { parentPort, workerData } = require('worker_threads')
const axios = require('axios')
const { Worker } = require('worker_threads')
const hyperquest = require('hyperquest')
const JSONStream = require('JSONStream')
const es = require('event-stream')
// Create new worker
const { StaticPool } = require('node-worker-threads-pool')
const redis = require('./redis')
const config = require('./config')
if (config.test == true) {
  redis.select(1)
} else {
  redis.select(0)
}
const { promisify } = require('util')
const request = require('request')
const { fetchJson, Healthpool } = require('./fetchjson')
const redisMulti = redis.multi()
const execMultiAsync = promisify(redisMulti.exec).bind(redisMulti)
const hscan = promisify(redis.hscan).bind(redis)
const hget = promisify(redis.hget).bind(redis)
const get = promisify(redis.get).bind(redis)
const hset = promisify(redis.hset).bind(redis)
const smembers = promisify(redis.smembers).bind(redis)

parentPort.on('message', async data => {
  const resdata = await courseStats(data.studentId)
  parentPort.postMessage(resdata)
})

async function courseStats (studentId) {
  let courseStats = await hget('stats:Courses', 'all')
  courseStats = JSON.parse(courseStats)

  if (courseStats && Object.entries(courseStats).length !== 0) return courseStats

  const courseList = await smembers('courses')
  const courses = []
  courseList.forEach(course => {
    courses.push(course)
    redisMulti.ZREVRANGE('course:' + course, 0, 0, 'withscores')
    redisMulti.ZREVRANGE('course:' + course, -1, -1, 'withscores')
    redisMulti.ZCOUNT('course:' + course, '0', '100')
    redisMulti.GET('course:' + course + ':sum')
  })

  const resp = await execMultiAsync()

  const courseData = {}
  let x = 0

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i]

    for (x; x < i + 1; x++) {
      const x = ((i + 1) * 4) - 1

      const count = resp[x - 1]
      const sum = resp[x]
      const min = resp[x - 2][1]
      const max = resp[x - 3][1]
      const average = (sum / count)

      courseData[course] = { max, min, average }
    }
  };

  await hset('stats:Courses', 'all', JSON.stringify(courseData))

  // res.json(courseData)
  return courseData
}
