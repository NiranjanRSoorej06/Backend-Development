//Arrays
var arra=[1,2,3,"ABC",function(){},false,'A'];
//Methods => foreach,map,filter,find,indexOf

var arr=[1,2,3,4];
//forEach
arr.forEach(function(val){
    console.log(val+" hello");
})
//map
var arr2=arr.map(function(val){
    return val
})
console.log(arr2);
//filter
var arr3=arr.filter(function(val){
    if(val>=3){ return true;}
    else return false;
}) 
console.log(arr3);
//find
var ans=arr.find(function(val){
    if(val==2)return val;
})
console.log(ans);
//indexOf
var ans2=arr.indexOf(2)
console.log(ans2)


//Objects
var obj={
    name:"Niranjan",
    age:19
}
console.log(obj.name,obj.age)
Object.freeze(obj)//Permanent Obj;
 

//Async
var ans=async function(a){
    await fetch();
}