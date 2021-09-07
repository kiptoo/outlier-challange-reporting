// add this script in myWorker.js file
const { parentPort, workerData } = require('worker_threads')
const redis = require('./redis')
const config = require('./config')
if (config.test == true) {
  redis.select(1)
} else {
  redis.select(0)
}

parentPort.on('message', data => {
  parentPort.postMessage(health(data.studentId))
})

function health (studentId) {
  try {
    return { success: studentId }
  } catch (e) {
    console.log(e)
    return { success: false }
  }
}
