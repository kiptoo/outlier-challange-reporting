//add this script in myWorker.js file
const {parentPort, workerData} = require("worker_threads")
const {Worker} = require("worker_threads");
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

let responseData = await searchStudentGrades(data.currentStudent)
  parentPort.postMessage(responseData);
});

 async function searchStudentGrades(currentStudent) {
 
let user_id = currentStudent.id


  //given the id of current student,we can do a search  to find the student in the array
  let firstIndex;
  let lastIndex;
  function isStudent(student,index) {
    
    if(student.id === user_id){
      firstIndex =index;
      return student
    }
  
  }

  let jsonData = await get("grades:all")
  jsonData = JSON.parse(jsonData);
  if(!jsonData)return {}
    if(!jsonData.length)return  {}
  let user =  jsonData.find(isStudent);
  
  //the find function returns,the first matching value....
  // we get the index of that value and since our list is a soted lits by student id ,
  //then all the values for this user will be in the next array,so we do a for loop
  // from  the found value using the index and loop till we find another user
  
  let arrayStart = jsonData[firstIndex]
  let courseList = []
 
  
    for (let i = firstIndex; i < jsonData.length; i++) {
      const element = jsonData[i];
     
      //do a fast retun to break the loop as long as we got what we want
      if(!element)break
     if( element.id!==user_id) break
     lastIndex = i;
     courseList.push(element)
   
   
  }
  let arrayEnd = jsonData[lastIndex]
 
  currentStudent.grades =courseList
  await hset("studentsGrades","student:id:"+user_id,JSON.stringify(currentStudent))


  return currentStudent 


}
