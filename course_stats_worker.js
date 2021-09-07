//add this script in myWorker.js file
const {parentPort, workerData} = require("worker_threads")
const axios = require('axios');
const {Worker} = require("worker_threads");
const hyperquest = require('hyperquest')
const JSONStream = require('JSONStream');
const es = require('event-stream');
//Create new worker
const {StaticPool} = require("node-worker-threads-pool");
var redis = require("./redis");
var config= require("./config");
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




parentPort.on("message", async data => {

let resdata = await courseStats(data.studentId)
  parentPort.postMessage(resdata);
});

async  function courseStats(studentId) {


  let courseStats = await hget("stats:Courses","all")
  courseStats = JSON.parse(courseStats)

  if(courseStats && Object.entries(courseStats).length !== 0) return courseStats
 
  let courseList  = await smembers("courses")
  let courses =[]
  courseList.forEach(course => {
    courses.push(course)
    redisMulti.ZREVRANGE ("course:"+course,0,0,"withscores")    
    redisMulti.ZREVRANGE  ("course:"+course,-1,-1,"withscores")
    redisMulti.ZCOUNT ("course:"+course,"0", "100")
     redisMulti.GET("course:"+course+":sum")
  });

  let resp = await execMultiAsync();


let courseData = {}
let x = 0

 for(let i = 0; i < courses.length; i++){
 let course = courses[i];
 
  for( x; x <i+1; x++){
     let x =((i+1)*4)-1;
   
     
       let count =resp[x-1]
       let sum =resp[x]
       let min = resp[x-2][1]
       let max = resp[x-3][1]
       let average = (sum/count)
   
    courseData[course]  ={max,min,average}
      
   }
   
 };

 await hset("stats:Courses","all",JSON.stringify(courseData))
  
  // res.json(courseData)
  return courseData;
}
