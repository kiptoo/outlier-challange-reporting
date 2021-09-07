const tape = require('tape')
const jsonist = require('jsonist')
require("dotenv").config();
const port = (process.env.PORT = process.env.PORT || require('get-port-sync')())
const endpoint = `http://localhost:${port}`
process.env.TEST=true
var redis = require("./redis");
const knex = require('./db')
const server = require('./server')
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
const flushdb = promisify(redis.flushdb).bind(redis);
var config= require("./config");
if(config.test==true){
  redis.select(1);
}
else{
  redis.select(0);
}


tape("setup", async (t) => {
  process.env.TEST=true
  await flushdb()
 // fetchJson()
 t.end();
});
tape('health', async function (t) {
  
  const url = `${endpoint}/health`
  try {
    const { data, response } = await jsonist.get(url)
    if (response.statusCode !== 200) {
      throw new Error('Error connecting to sqlite database; did you initialize it by running `npm run init-db`?')
    }
    t.ok(data.success, 'should have successful healthcheck')
    t.end()
  } catch (e) {
    t.error(e)
  }
})
tape('Get student', async function (t) {
  let student_id = 560;
  let studentData ={
    "id": 560,
    "first_name": "Marques",
    "last_name": "Walker",
    "email": "Marques_Walker19@hotmail.com",
    "is_registered": 1,
    "is_approved": 0,
    "password_hash": "d4ceb87f455d40066cb531d284e1c6905212bade",
    "address": "01243 Paucek Lake Suite 466",
    "city": "Middletown",
    "state": "DE",
    "zip": "72160",
    "phone": "353-575-1695 x7578",
    "created": "1628752803174.0",
    "last_login": "1628724820486.0",
    "ip_address": "60.1.216.112"
}
  const url = `${endpoint}/student/${student_id}`
  try {
    const { data, response } = await jsonist.get(url)
  
    if (response.statusCode !== 200) {
      throw new Error('Error connecting to sqlite database; did you initialize it by running `npm run init-db`?')
    }
    t.ok(data, 'should have the student')
    t.deepEqual(data,studentData,'student returned match')
    t.end()
  } catch (e) {
    t.error(e)
  }
})
tape('Student grades', async function (t) {
   let student_id = 6;
     let students = await knex('students')
    .select('*')
    .where('students.id',student_id)
 let currentStudent = students[0]
  currentStudent.grades = [{"id":6,"course":"Calculus","grade":24}]
  const url = `${endpoint}/student/${student_id}/grades`
  try {
    const { data, response } = await jsonist.get(url)
    if (response.statusCode !== 200) {
      throw new Error('Error connecting to sqlite database; did you initialize it by running `npm run init-db`?')
    }
     t.ok(data, 'should have the student')
     t.deepEqual(data,currentStudent,'grades returned match')
    t.end()
  } catch (e) {
    t.error(e)
  }
})
tape('Course Stats', async function (t) {
   let courses =["Calculus","Microeconomics","Statistics","Astronomy","Philosophy"]
  let  courseData ={}
   courses.forEach(course => {
     let grades =config.testData.filter((grades)=>{
     return  grades.course==course

     }).map((grade)=>{
        return grade.grade
     })

     let count =grades.length
     let sum = grades.reduce((sum, val) => sum + val, 0)
     let average = sum/count
     let min = Math.min.apply(null, grades)
     let max = Math.max.apply(null, grades)
     courseData[course]={max,min,average}

   });

  const url = `${endpoint}/course/all/grades`
  try {
    const { data, response } = await jsonist.get(url)

    if (response.statusCode !== 200) {
      throw new Error('Error connecting to sqlite database; did you initialize it by running `npm run init-db`?')
    }
     t.ok(data, 'should have course stats')
     t.deepLooseEqual(data,courseData,'Courses stats  returned match')
    t.end()
  } catch (e) {
    t.error(e)
  }
})


tape('cleanup', async function (t) {
  process.env.TEST=false
  await flushdb()
  server.closeDB()
  server.close()

  t.end()
})
