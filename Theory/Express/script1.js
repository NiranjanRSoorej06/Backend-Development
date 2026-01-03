const express=require('express')
const app=express();

app.get('/',function(req,res){
    res.send("Main Page");
});
app.get('/profile',function(req,res){
    res.send("Profile Page");
})
app.listen(3000);