const socket = io();
const chess=new Chess();
const boardElement = document.querySelector(".chessboard");
const boardRow = document.getElementById("boardRow");
const modal = document.getElementById("gameOverModal");
const winnerText = document.getElementById("winnerText");
const restartBtn = document.getElementById("restartBtn");
const capturedLeft = document.getElementById("capturedLeft");
const capturedRight = document.getElementById("capturedRight");
const drawBtn = document.getElementById("drawBtn");
const resignBtn = document.getElementById("resignBtn");
const drawNotification = document.getElementById("drawNotification");

const STARTING_COUNTS = {
    w: { p: 8, r: 2, n: 2, b: 2, q: 1, k: 1 },
    b: { p: 8, r: 2, n: 2, b: 2, q: 1, k: 1 },
};

let capturedByWhite = [];
let capturedByBlack = [];


let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let drawOffered = false;
let resigning = false;

const findKingSquare = (color) => {
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece.type === "k" && piece.color === color) {
                return { row: r, col: c };
            }
        }
    }
    return null;
};
const showGameOver = (winnerColor) => {
    if (winnerColor === "draw") {
        winnerText.innerText = "DRAW";
    } else {
        winnerText.innerText = winnerColor === "w" ? "White Wins ♔" : "Black Wins ♚";
    }
    modal.classList.remove("hidden");
    modal.classList.add("show");
};

const hideGameOver = () => {
    modal.classList.add("hidden");
    modal.classList.remove("show");
};

const updateCapturedAlignment = () => {
    if (!capturedLeft || !capturedRight) return;
    capturedLeft.classList.remove("captured-rail-enemy", "captured-rail-own");
    capturedRight.classList.remove("captured-rail-enemy", "captured-rail-own");

    // When board is flipped (black player), swap vertical alignment:
    // Left rail (white losses) near black side (bottom) and
    // Right rail (black losses) near white side (top).
    if (playerRole === "b") {
        capturedLeft.classList.add("captured-rail-own");      // bottom
        capturedRight.classList.add("captured-rail-enemy");    // top
    } else {
        capturedLeft.classList.add("captured-rail-enemy");     // top
        capturedRight.classList.add("captured-rail-own");      // bottom
    }
};

const updateHorizontalRails = () => {
    if (!boardRow) return;
    // For black player, reverse the left-right order of rails around the board
    if (playerRole === "b") {
        boardRow.classList.add("black-view");
    } else {
        boardRow.classList.remove("black-view");
    }
};

const renderCaptured = () => {
    if (!capturedLeft || !capturedRight) return;

    capturedLeft.innerHTML = "";
    capturedRight.innerHTML = "";

    // Fixed orientation: left rail shows white losses (pieces captured by black), right rail shows black losses (pieces captured by white)
    const leftPieces = capturedByBlack;   // white pieces captured by black
    const rightPieces = capturedByWhite;  // black pieces captured by white

    const renderTray = (container, pieces) => {
        pieces.forEach((piece) => {
            const span = document.createElement("span");
            span.classList.add("piece", "captured-piece", piece.color === "w" ? "white" : "black");
            span.innerText = getPieceUnicode(piece);
            container.appendChild(span);
        });
    };

    renderTray(capturedLeft, leftPieces);
    renderTray(capturedRight, rightPieces);
};

const rebuildCapturedFromBoard = () => {
    const remaining = {
        w: { ...STARTING_COUNTS.w },
        b: { ...STARTING_COUNTS.b },
    };

    chess.board().forEach((row) => {
        row.forEach((piece) => {
            if (piece) {
                remaining[piece.color][piece.type] -= 1;
            }
        });
    });

    capturedByWhite = [];
    capturedByBlack = [];

    Object.entries(remaining.b).forEach(([type, count]) => {
        for (let i = 0; i < count; i += 1) {
            capturedByWhite.push({ type, color: "b" });
        }
    });

    Object.entries(remaining.w).forEach(([type, count]) => {
        for (let i = 0; i < count; i += 1) {
            capturedByBlack.push({ type, color: "w" });
        }
    });

    renderCaptured();
};
const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML="";
    board.forEach((row,rowindex) => {
        row.forEach((square,squareindex)=>{
            const squareElement = document.createElement("div");
            squareElement.classList.add("square",
                 (rowindex + squareindex)%2 === 0 ? "light":"dark"
            );

            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;

            if(square){
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece",square.color === "w"?"white":"black"
                );
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;
                
                pieceElement.addEventListener("dragstart",(e)=>{
                    if(pieceElement.draggable){
                        draggedPiece = pieceElement;
                        sourceSquare = { row:rowindex,col:squareindex};
                        e.dataTransfer.setData("text/plain","");
                        highlightPossibleMoves(rowindex, squareindex);
                    }
                });

                pieceElement.addEventListener("dragend",(e)=>{
                    draggedPiece=null;
                    sourceSquare=null;
                    clearPossibleMoves();
                });
                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover",(e)=>{
                e.preventDefault();
            });

            squareElement.addEventListener("drop",(e)=>{
                e.preventDefault();
                if(draggedPiece){
                    const targetSource={
                        row:parseInt(squareElement.dataset.row),
                        col:parseInt(squareElement.dataset.col),
                    };

                    handleMove(sourceSquare,targetSource);
                }
            });

            const turnColor = chess.turn(); // 'w' or 'b'

            if (chess.in_check() || chess.in_checkmate()) {
                const kingPos = findKingSquare(turnColor);

                if (
                    kingPos &&
                    kingPos.row === rowindex &&
                    kingPos.col === squareindex
                ) {
                    squareElement.classList.add(
                        chess.in_checkmate() ? "checkmate" : "check"
                    );
                }
            }
            boardElement.append(squareElement);
        });
    });
    if(playerRole === 'b'){
        boardElement.classList.add("flipped");
    }else{
        boardElement.classList.remove("flipped");
    }
    if (chess.in_checkmate()) {
        const loser = chess.turn();       // side to move is checkmated
        const winner = loser === "w" ? "b" : "w";
        showGameOver(winner);
    }
    rebuildCapturedFromBoard();
};

restartBtn.addEventListener("click", () => {
    hideGameOver();
    socket.emit("restartGame");
});

const updateDrawButton = (state) => {
    if (!drawBtn) return;
    drawBtn.classList.remove("offering");
    console.log("Updating draw button to state:", state, "playerRole:", playerRole);
    switch (state) {
        case "offered":
            drawBtn.disabled = true;
            drawBtn.innerText = "Offering Draw...";
            drawBtn.classList.add("offering");
            break;
        case "locked":
            drawBtn.disabled = true;
            drawBtn.innerText = "Draw";
            break;
        case "spectator":
            drawBtn.disabled = true;
            drawBtn.innerText = "Spectating";
            break;
        default:
            drawBtn.disabled = false;
            drawBtn.innerText = "Offer Draw";
            break;
    }
};

const updateResignButton = (state) => {
    if (!resignBtn) return;
    resignBtn.classList.remove("resigning");
    console.log("Updating resign button to state:", state, "playerRole:", playerRole);
    switch (state) {
        case "pending":
            resignBtn.disabled = true;
            resignBtn.innerText = "Resigning...";
            resignBtn.classList.add("resigning");
            break;
        case "spectator":
            resignBtn.disabled = true;
            resignBtn.innerText = "Spectating";
            break;
        default:
            resignBtn.disabled = playerRole === null;
            resignBtn.innerText = "Resign";
            break;
    }
};

if (drawBtn) {
    drawBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("Button clicked! drawOffered:", drawOffered, "playerRole:", playerRole, "disabled:", drawBtn.disabled);
        if (drawOffered || playerRole === null) {
            console.log("Click ignored - already offered or no role");
            return;
        }
        console.log("Draw offer sent to server");
        socket.emit("offerDraw");
    });
}

if (resignBtn) {
    resignBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("Resign button clicked! playerRole:", playerRole, "disabled:", resignBtn.disabled);
        if (resigning || playerRole === null) {
            console.log("Click ignored - already resigning or no role");
            return;
        }
        console.log("Resign sent to server");
        resigning = true;
        updateResignButton("pending");
        socket.emit("resign");
    });
}

const handleMove =(source,target) => {
    const move={
        from: `${String.fromCharCode(97+source.col)}${8-source.row}`,
        to:`${String.fromCharCode(97+target.col)}${8-target.row}`,
        promotion:'q'
    };
    socket.emit("move",move);
};

const getPieceUnicode = (piece) => {
  const unicodePieces = {
    p: "♟",
    r: "♜",
    n: "♞",
    b: "♝",
    q: "♛",
    k: "♚",

    P: "♙",
    R: "♖",
    N: "♘",
    B: "♗",
    Q: "♕",
    K: "♔",
  };

  const key =
    piece.color === "w"
      ? piece.type.toUpperCase()
      : piece.type.toLowerCase();

  return unicodePieces[key];
};

const highlightPossibleMoves = (row, col) => {
    const from = `${String.fromCharCode(97 + col)}${8 - row}`;
    const moves = chess.moves({ square: from, verbose: true });
    
    moves.forEach(move => {
        const toCol = move.to.charCodeAt(0) - 97;
        const toRow = 8 - parseInt(move.to[1]);
        const square = document.querySelector(`[data-row="${toRow}"][data-col="${toCol}"]`);
        if (square) {
            square.classList.add("possible-move");
            if (square.querySelector(".piece")) {
                square.classList.add("has-piece");
            }
        }
    });
};

const clearPossibleMoves = () => {
    document.querySelectorAll(".possible-move").forEach(square => {
        square.classList.remove("possible-move", "has-piece");
    });
};
socket.on("playerRole",function(role){
    console.log("Player role received:", role);
    playerRole = role;
    drawOffered = false;
    resigning = false;
    updateCapturedAlignment();
    updateHorizontalRails();
    updateDrawButton(); // Enable button for players
    updateResignButton();
    renderBoard();
});
socket.on("spectatorRole",function(){
    playerRole=null;
    drawOffered = false;
    resigning = false;
    updateCapturedAlignment();
    updateHorizontalRails();
    updateDrawButton("spectator");
    updateResignButton("spectator");
    renderBoard();
});
socket.on("boardState",function(fen){
    chess.load(fen);
    renderBoard();
});
socket.on("move",function(move){
    chess.move(move);
    renderBoard();
});
socket.on("restartGame", (fen) => {
    chess.reset();          // fallback
    if (fen) chess.load(fen);
    drawOffered = false;
    resigning = false;
    if (playerRole) {
        updateDrawButton();
        updateResignButton();
    } else {
        updateDrawButton("spectator");
        updateResignButton("spectator");
    }
    renderBoard();
});

socket.on("drawOfferPending", () => {
    console.log("Draw offer pending - waiting for opponent response");
    drawOffered = true;
    updateDrawButton("offered");
});

const showDrawNotification = () => {
    if (!drawNotification) return;
    drawNotification.classList.remove("hidden");
};

const hideDrawNotification = () => {
    if (!drawNotification) return;
    drawNotification.classList.add("hidden");
};

window.acceptDraw = () => {
    console.log("Draw accepted");
    hideDrawNotification();
    drawOffered = true;
    updateDrawButton("offered");
    socket.emit("offerDraw");
};

window.declineDraw = () => {
    console.log("Draw declined");
    hideDrawNotification();
    socket.emit("declineDraw");
};

socket.on("opponentDrawOffer", () => {
    console.log("Received opponent draw offer notification");
    showDrawNotification();
});

socket.on("drawOfferDeclined", () => {
    console.log("Draw offer was declined by opponent");
    drawOffered = false;
    updateDrawButton();
});

socket.on("drawUnavailable", () => {
    console.log("Draw unavailable - no opponent connected");
    drawOffered = false;
    updateDrawButton();
});

socket.on("drawAgreed", () => {
    console.log("Draw agreed!");
    drawOffered = false;
    updateDrawButton("locked");
    showGameOver("draw");
});

socket.on("drawCancelled", () => {
    drawOffered = false;
    if (playerRole) {
        updateDrawButton();
    } else {
        updateDrawButton("spectator");
    }
});

socket.on("resignResult", (winner) => {
    console.log("Resign result - winner:", winner);
    resigning = false;
    updateResignButton();
    showGameOver(winner);
});

renderBoard();
