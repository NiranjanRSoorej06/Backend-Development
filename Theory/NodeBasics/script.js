const fs=require('fs');
fs.writeFile("hello.txt","This is the data",function(err){
    if(err)console.log(err);
    else console.log("Done");
})
fs.appendFile("hello.txt","\nThis is the appended data.",function(err){
    if(err)console.log(err);
    else console.log("Done");
})
fs.rename("hello.txt","renamed.txt",function(err){
    if(err)console.log(err);
    else console.log("Done");
})
fs.copyFile("renamed.txt","cpy.txt",function(err){
    if(err)console.log(err);
    else console.log("done");
})
fs.unlink("cpy.txt",function(err){
    if(err)console.log(err.message)
    else console.log("Done.")
})
fs.rmdir("./Copy",function(err){
    if(err)console.log(err)
    else console.log("Done")
})