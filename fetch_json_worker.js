const axios = require('axios');
const {Worker} = require("worker_threads");
const hyperquest = require('hyperquest')
const JSONStream = require('JSONStream');
const es = require('event-stream');
var redis = require("./redis");
const { promisify } = require("util");
//Create new worker
const {StaticPool} = require("node-worker-threads-pool");
var config= require("./config");
if(config.test){
 
  redis.select(1);
}
else{
 
  redis.select(0);
}
const redisMulti = redis.multi();
const execMultiAsync = promisify(redisMulti.exec).bind(redisMulti);
const keyexist = promisify(redis.exists).bind(redis);
const flushdb = promisify(redis.flushdb).bind(redis);
const get = promisify(redis.get).bind(redis);
const {parentPort, workerData} = require("worker_threads")
var Grades=[]
var courseListAll=[] 
var SumcourseListAll=[] 
parentPort.on("message", async data => {

  let resdata = await pushJsonData(data.studentId)
  parentPort.postMessage({results: resdata });
 
  });
  
    async function pushJsonData(studentId) {
       let datafromUrl=[]
       
   if (config.test) {
    console.log('fetching json data, adding to redis.....')
    datafromUrl =config.testData
   }else{
    console.log('fetching json data from https://outlier-coding-test-data.netlify.app/grades.json ......',new Date() );
    datafromUrl = await axios.get('https://outlier-coding-test-data.netlify.app/grades.json')
    .then(response => {
      
      Grades = response.data
    
      return response.data
      
    })
    .catch(error => {
     
      return []
    });
    }

   console.log("fetched data of size :-",datafromUrl.length);

      let sum = 0
         let courses = []
    for (let i = 0; i < datafromUrl.length; i++) {
      const element = datafromUrl[i];
        addcourses(element.course,element.grade)
  
       let key = "student:id:" + element.id;
      redisMulti.sadd("courses",element.course)
      redisMulti.zadd("course:"+element.course,element.grade,key)
      
    }
    redisMulti.set("grades:all",JSON.stringify(datafromUrl));
    redisMulti.expire("grades:all", 3600);

  
      let resp = await execMultiAsync();
     
   
   courseListAll.forEach(course => {
    redisMulti.set("course:"+course+":sum",SumcourseListAll[course])  
   })
    resp = await execMultiAsync();
      console.log('done fetching json data in',new Date()  );
    return datafromUrl
  }
  
  function addcourses(course,grade){
   
   if(courseListAll.includes(course)){
  
     
     SumcourseListAll[course]+=parseInt(grade)
     
   }
   else{
     courseListAll.push(course)
     SumcourseListAll[course]= 0;
     
       SumcourseListAll[course]+=parseInt(grade)
       
   } 
   
  }