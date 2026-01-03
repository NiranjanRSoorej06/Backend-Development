const express=require('express');
const path=require("path");
const socket=require("socket.io");
const http=require("http");
const {Chess}=require("chess.js");

const app=express();

const server=http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players={};
let currentPlayer="w";
let gameOver=false;
let drawOffers = new Set();

app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));

app.get("/",function(req,res){
    res.render("index",{"title": "Chess Game"});
});

io.on("connection",function(uniquesocket){
    console.log("Connected");

    if(!players.white){
        players.white=uniquesocket.id;
        uniquesocket.emit("playerRole","w");
    }else if(!players.black){
        players.black=uniquesocket.id;
        uniquesocket.emit("playerRole","b");
    }else{
        uniquesocket.emit("spectatorRole");
    }
    uniquesocket.on("disconnect",function(){
        if(uniquesocket.id === players.white){
            delete players.white;
        }else if(uniquesocket.id === players.black){
            delete players.black;
        }
        drawOffers.delete(uniquesocket.id);
    });
    uniquesocket.on("move",(move)=>{
        try{
            if(gameOver) return;
            if(chess.turn()==='w' && uniquesocket.id !=players.white)return;    //If white is moving in white's turn
            if(chess.turn()==='b' && uniquesocket.id !=players.black)return;    //If black is moving in black's turn

            const result = chess.move(move);                                    //Checking for valid move or not
            if(result){                                                         //If valid => Save move
                currentPlayer = chess.turn();
                const hadOffers = drawOffers.size > 0;
                drawOffers.clear();                                             //Clear any pending draw offers
                io.emit("move",move);                                           //Sending that move to all players
                io.emit("boardState", chess.fen());
                if(hadOffers) {
                    io.emit("drawCancelled");                                   //Notify clients to reset draw buttons only if there were offers
                }
            }else{
                console.log("Invalid Move : ",move);
                uniquesocket.emit("invelidMove",move);
            }
        }
        catch(err){
            console.log(err);
            uniquesocket.emit("Invalid Move : ",move);
        }
    });
    uniquesocket.on("offerDraw", () => {
        if(gameOver) return;
        const opponentId = uniquesocket.id === players.white ? players.black : uniquesocket.id === players.black ? players.white : null;
        if(!opponentId){
            uniquesocket.emit("drawUnavailable");
            return;
        }
        drawOffers.add(uniquesocket.id);
        uniquesocket.emit("drawOfferPending");
        // If both have offered, auto-agree draw
        if (drawOffers.has(opponentId)) {
            gameOver = true;
            drawOffers.clear();
            io.emit("drawAgreed");
            return;
        }
        // Notify opponent of the draw offer
        io.to(opponentId).emit("opponentDrawOffer");
    });

    uniquesocket.on("declineDraw", () => {
        if(gameOver) return;
        const offerer = uniquesocket.id === players.white ? players.black : uniquesocket.id === players.black ? players.white : null;
        if(offerer) {
            io.to(offerer).emit("drawOfferDeclined");
            drawOffers.delete(offerer);
        }
        drawOffers.delete(uniquesocket.id);
    });

    uniquesocket.on("resign", () => {
        if(gameOver) return;
        gameOver = true;
        const winner = uniquesocket.id === players.white ? "b" : "w";
        io.emit("resignResult", winner);
    });

    uniquesocket.on("restartGame", () => {
        chess.reset(); // your chess instance
        gameOver=false;
        drawOffers.clear();
        io.emit("restartGame", chess.fen());
    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
