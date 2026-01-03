const express= require('express')
const app=express();

app.use(function(req,res,next){
    console.log("Middleware chala");
    next();
});
app.use(function(req,res,next){
    console.log("Middleware ek aur chala");
    next();
});

//routes create 
//app.get(Router,requestHandler)
app.get("/",function(req,res){
    //res.send("Champion mera anuj")
    return next(new Error("Somithing is wrong..."))
})

//Error Handling
app.use(function(err,req,res,next){
    console.error(err.stack)
    res.status(500).send("Somithing broke !");
})
app.listen(3000);