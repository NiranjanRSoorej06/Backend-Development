const express=require('express');
const app=express();
const cookieParser=require('cookie-parser');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');

app.use(cookieParser())
app.get("/",function(req,res){
    res.cookie("name","harsh");
    res.send("Done");
});

app.get("/read",function(req,res){
    res.send("Read");
    console.log(req.cookies);
});

//Encrypt Password
app.get("/bcrypt",function(req,res){
    bcrypt.genSalt(10, function(err,salt){
        bcrypt.hash("polopolo",salt,function(err,hash){
            console.log(hash);
        });
    });
})
//Decryption using Compare
app.get("/bcrypt_compare",function(req,res){
    bcrypt.compare("polopolo","$2b$10$3QACqgLipVvdhv9HcjtkherKrof1/DhJo3zUH6fi3OYDPs3R2dzqG",function(err,result){
        console.log(result);
    });
})
//JWT
app.get("/jwt",function(req,res){
    let token = jwt.sign({email:"harsh@gmail.com"},"secret");
    res.cookie("token",token)
    res.send("Done");
})
app.get("/readCookie",function(req,res){
    //console.log(req.cookies.token);
    let data=jwt.verify(req.cookies.token,"secret");
    console.log(data);
})

app.listen(3000);