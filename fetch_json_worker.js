const axios = require('axios')
const { parentPort } = require('worker_threads')
const redis = require('./redis')
const { promisify } = require('util')
const config = require('./config')
const redisMulti = redis.multi()
const execMultiAsync = promisify(redisMulti.exec).bind(redisMulti)
if (config.test) {
  redis.select(1)
} else {
  redis.select(0)
}
let Grades = []
const courseListAll = []
const SumcourseListAll = []

parentPort.on('message', async data => {
  const resdata = await pushJsonData(data.studentId)
  parentPort.postMessage({ results: resdata })
})

async function pushJsonData (studentId) {
  let datafromUrl = []

  if (config.test) {
    console.log('fetching json data, adding to redis.....')
    datafromUrl = config.testData
  } else {
    console.log('fetching json data from https://outlier-coding-test-data.netlify.app/grades.json ......', new Date())
    datafromUrl = await axios.get('https://outlier-coding-test-data.netlify.app/grades.json')
      .then(response => {
        Grades = response.data

        return response.data
      })
      .catch(error => {
        return []
      })
  }

  console.log('fetched data of size :-', datafromUrl.length)

  const sum = 0
  const courses = []
  for (let i = 0; i < datafromUrl.length; i++) {
    const element = datafromUrl[i]
    addcourses(element.course, element.grade)

    const key = 'student:id:' + element.id
    redisMulti.sadd('courses', element.course)
    redisMulti.zadd('course:' + element.course, element.grade, key)
  }
  redisMulti.set('grades:all', JSON.stringify(datafromUrl))
  redisMulti.expire('grades:all', 3600)

  let resp = await execMultiAsync()

  courseListAll.forEach(course => {
    redisMulti.set('course:' + course + ':sum', SumcourseListAll[course])
  })
  resp = await execMultiAsync()
  console.log('done fetching json data in', new Date())
  return datafromUrl
}

function addcourses (course, grade) {
  if (courseListAll.includes(course)) {
    SumcourseListAll[course] += parseInt(grade)
  } else {
    courseListAll.push(course)
    SumcourseListAll[course] = 0

    SumcourseListAll[course] += parseInt(grade)
  }
}
