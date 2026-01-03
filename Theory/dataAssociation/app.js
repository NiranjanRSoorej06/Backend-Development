const express=require('express');
const app=express();
const userModel=require("./models/user");
const postModel=require("./models/posts");


app.get("/",function(req,res){
    res.send("Working");
});
app.get("/create",async(req,res)=>{
    let user=await userModel.create({
        username:"harsh",
        email:"harsh@gmail.com",
        age:19
    })
    res.send(user);
})
app.get("/post/create",async(req,res)=>{
    let post = await postModel.create({
        postData:"Hello everybody",
        user:"6947e425371aefdea9dde4d4",
    });
    let user= await userModel.findOne({_id:"6947e425371aefdea9dde4d4"});
    user.posts.push(post._id);
    await user.save();

    res.send({post,user});
})


app.listen(3000);