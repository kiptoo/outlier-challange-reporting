
const { parentPort } = require('worker_threads')
const { promisify } = require('util')
const redis = require('./redis')
const config = require('./config')
const get = promisify(redis.get).bind(redis)
const hset = promisify(redis.hset).bind(redis)
if (config.test == true) {
  redis.select(1)
} else {
  redis.select(0)
}

parentPort.on('message', async data => {
  const responseData = await searchStudentGrades(data.currentStudent)
  parentPort.postMessage(responseData)
})

async function searchStudentGrades (currentStudent) {
  const user_id = currentStudent.id

  // given the id of current student,we can do a search  to find the student in the array
  let firstIndex
  let lastIndex
  function isStudent (student, index) {
    if (student.id === user_id) {
      firstIndex = index
      return student
    }
  }

  let jsonData = await get('grades:all')
  jsonData = JSON.parse(jsonData)
  if (!jsonData) return {}
  if (!jsonData.length) return {}
  const user = jsonData.find(isStudent)

  // the find function returns,the first matching value....
  // we get the index of that value and since our list is a soted lits by student id ,
  // then all the values for this user will be in the next array,so we do a for loop
  // from  the found value using the index and loop till we find another user

  const arrayStart = jsonData[firstIndex]
  const courseList = []

  for (let i = firstIndex; i < jsonData.length; i++) {
    const element = jsonData[i]

    // do a fast retun to break the loop as long as we got what we want
    if (!element) break
    if (element.id !== user_id) break
    lastIndex = i
    courseList.push(element)
  }
  const arrayEnd = jsonData[lastIndex]

  currentStudent.grades = courseList
  await hset('studentsGrades', 'student:id:' + user_id, JSON.stringify(currentStudent))

  return currentStudent
}
