require("dotenv").config();
const knex = require('./db')
const axios = require('axios');
const {Worker} = require("worker_threads");
const hyperquest = require('hyperquest')
const JSONStream = require('JSONStream');
const es = require('event-stream');
//Create new worker
const {StaticPool} = require("node-worker-threads-pool");
var config= require("./config");
var redis = require("./redis");
if(config.test==true){
  redis.select(1);
}
else{
  redis.select(0);
}
const { promisify } = require("util");
const request = require('request')
const {fetchJson,Healthpool} =require('./fetchjson')
const redisMulti = redis.multi();
const execMultiAsync = promisify(redisMulti.exec).bind(redisMulti);
const hscan = promisify(redis.hscan).bind(redis);
const hget = promisify(redis.hget).bind(redis);
const get = promisify(redis.get).bind(redis);
const hset = promisify(redis.hset).bind(redis);
const smembers = promisify(redis.smembers).bind(redis);
 fetchJson()

module.exports = {
  getHealth,
  getStudent,
  getStudentGradesReport,
  getCourseGradesReport
}
let courseStatsWorkerPool= new StaticPool({
  size: 1,
  task: "./course_stats_worker.js"
});

async function getHealth (req, res, next) {
  
   await knex('students').first()

  let data = await gethealthworker("all")
   res.json(data)
}

async function getStudent (req, res, next) {

 let user_id =req.params.id;

  try {
    let students = await knex('students')
    .select('*')
    .where('students.id',user_id)
 
  res.json(students[0])
  } catch (e) {
    console.log(e)
    res.status(500).end()
    // throw new Error('This method has not been implemented yet.')
  }
}

async function getStudentGradesReport (req, res, next) {
  try {
 let user_id =req.params.id;
  
    user_id = parseInt(user_id);
    let studentgrades = await hget("studentsGrades","student:id:"+user_id)
    studentgrades = JSON.parse(studentgrades)
   
    if(studentgrades && Object.entries(studentgrades).length !== 0) return res.json(studentgrades)
    let students = await knex('students')
    .select('*')
    .where('students.id',user_id)
    let currentStudent = students[0]
    
  //early return
  if(!students.length)return res.json({})

    let data = await getGradesWorker(currentStudent)
     res.json(data)
    
  } catch (e)
  {
   console.log(e)
   
   throw new Error('This method has not been implemented yet.')
 }
}

async function getCourseGradesReport (req, res, next) {
try{
     let data = await courseStatsWorker("all")

    res.json(data)
} catch (e)
{
 console.log(e)
 
 throw new Error('This method has not been implemented yet.')
}
}

async  function gethealthworker(studentId) {
  return new Promise(async (resolve, reject) => {

 let  healthPool= new StaticPool({
  size: 1,
  task: "./health_worker.js"
});
  
  healthPool.exec({studentId: studentId}).then(result => {
   
    resolve(result)
  });
    })
}

async  function getGradesWorker(currentStudent) {
  return new Promise(async (resolve, reject) => {
 let gradesPool= new StaticPool({
  size: 1,
  task: "./find_grades_worker.js"
});
    gradesPool.exec({currentStudent: currentStudent}).then(result => {
     
      resolve(result)
    });
})
}
async  function courseStatsWorker(studentId) {
  return new Promise(async (resolve, reject) => {
let courseStats = await hget("stats:Courses","all")
  courseStats = JSON.parse(courseStats)
 
  if(courseStats && Object.entries(courseStats).length !== 0) resolve(courseStats) 

    courseStatsWorkerPool.exec({studentId: studentId}).then(result => {
 
      resolve(result)
    });
})
}



