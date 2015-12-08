var io;
var gameSocket;
var characterPos;
var dataSet = [];
var map;
var direction;
var wait = false;
var score = {
    body: 0,
    soul: 0
};
var showDoor = false;
var doorSize;
var doorX;
var doorY;
var numPlaying = 0;
var players = [];
var comments = [];


var allPlayers = {};
/**
 * This function is called by index.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.initGame = function(sio, socket, len, dir, serverMap) {
    io = sio;
    gameSocket = socket;
    direction = dir;
	
    if(len === 0){
        showDoor = false;
        doorSize = null;
    }

    gameSocket.emit('connected', {
        message: "You are connected!",
        count: players.length,
        charPos: characterPos,
        id: gameSocket.id,
        newMap: map,
        score: score,
        doorInfo: {
            dSize: doorSize,
            dX: doorX,
            dY: doorY
        }
    });
    // Host Events
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
    gameSocket.on('hostRoomFull', hostPrepareGame);
    gameSocket.on('hostCountdownFinished', hostStartGame);
    gameSocket.on('hostNextRound', hostNextRound);

    gameSocket.on('onButtonClicked', hostCtrlMove);
    gameSocket.on('hostInitMap', hostInitMap);
    gameSocket.on('updateCurrentNum', hostUpdateCurrentNum);
    gameSocket.on('addNewPlayer', hostAddNewPlayer);

    gameSocket.on('updateComments', hostUpdateComment);

    // Player Events
    gameSocket.on('playerJoinGame', playerJoinGame);
    // gameSocket.on('playerRestart', playerRestart);
    gameSocket.on('playerMove', playerMove);
    gameSocket.on('setPlayerPos', hostSetCharacterPos);
    gameSocket.on('setScore', hostSetScore);
    gameSocket.on('hostEndGame', hostEndGame);
    gameSocket.on('restartGame', hostRestartGame);

    gameSocket.on('pressLeft', playerDir);
    gameSocket.on('pressRight', playerDir);
    gameSocket.on('pressUp', playerDir);
    gameSocket.on('pressNone', playerDir);
  
    map = serverMap;

}

exports.leaveGame = function(io, socket, len) {
    players.splice(players.indexOf(socket.id), 1);
    if(allPlayers[socket.id]){
          delete allPlayers[socket.id];
    }
    io.sockets.emit('disconnected', {
        count: players.length
    });
}

/**
 * The 'START' button was clicked and 'hostCreateNewGame' event occurred.
 */
function hostCreateNewGame() {
    this.emit('newGameCreated', {
        gameStart: true
    });
}

function hostAddNewPlayer(data) {
    players.push(data);
}

function hostEndGame(data) {
    playerRestart();
    io.sockets.emit('gameEndingScene', data);
}

function hostUpdateComment(data) {
    if (data) {
        comments.push(data);
    }

    io.sockets.emit('showComments', comments);

    if (comments.length > 4) {
        comments = [];
    }
}

function hostSetScore(data) {
    if (data.key === 'crown' || data.key === 'coin') {
        score.body = score.body + 1;
    } else {
        score.soul = score.soul + 1;
    }

    io.sockets.emit('showScore', score);

    var total = score.body + score.soul;

    if (total > 20 && score.body > 15) {
        if (score.body - score.soul > 10) {
            if (!showDoor) {
                showDoor = true;
                //return a number between 50 - 80
                doorSize = Math.floor((Math.random() * 30) + 50);
                doorX = Math.floor((Math.random() * (1920 - 30)) + 30);
                doorY = Math.floor((Math.random() * (1920 - 30)) + 30);

                io.sockets.emit('generateDoor', {
                    dSize: doorSize,
                    dX: doorX,
                    dY: doorY
                });
            }
        }else{
            showDoor = false;
        }

    }

}

function hostUpdateCurrentNum(data) {
    numPlaying = data;
    console.log("currentPlaying", numPlaying);
    io.sockets.emit('updateCurNum', numPlaying);
}

function hostCtrlMove(data) {

    data.dataSet[0] = direction.left;
    data.dataSet[1] = direction.right;
    data.dataSet[2] = direction.up;
    data.dataSet[3] = direction.none;
    io.sockets.emit('showD3Chart', data.dataSet);
}

function hostInitMap(data) {
    map = data.newMap;
    io.sockets.emit('initMap', data.newMap);
}

function hostPrepareGame(gameId) {
    var sock = this;
    var data = {
        mySocketId: sock.id,
        gameId: gameId
    };
    //console.log("All Players Present. Preparing game...");
    io.sockets.in(data.gameId).emit('beginNewGame', data);
}

function hostStartGame(gameId) {
    console.log('Game Started.');
};

function hostRestartGame() {
    io.sockets.emit('playerRestartGame');
}

function hostSetCharacterPos(data) {
    characterPos = data.pos;
    allPlayers[data.id] = characterPos;
    io.sockets.emit('getCharacterPos', characterPos);
    io.sockets.emit('updateOthersPos', allPlayers);
}

function hostNextRound(data) {

}

function playerJoinGame(data) {
    io.sockets.emit('playerJoinedRoom', data);
}

function playerDir(data) {
    direction[data] += 1;
}

function playerMove(data) {
    if (!wait) {
        wait = true; // Prevent future invocations
        setTimeout(function() { // After a period of time
            wait = false; // And allow future invocations
            io.sockets.emit('playerMoveDir', getLargestVal(direction));

            dataSet[0] = direction["left"];
            dataSet[1] = direction["right"];
            dataSet[2] = direction["up"];
            dataSet[3] = direction["none"];

            io.sockets.emit('showD3Chart', dataSet);
            resetDirection(direction);
        }, 500);
    }

}

function getLargestVal(data) {
    var res = {};
    var tempV = 0;
    var tempK = 'none';
    for (var key in data) {
        if (data[key] >= tempV) {
            tempV = data[key];
            tempK = key;
        }
    }
    return tempK;
}

function resetDirection(data) {
    for (var key in data) {
        data[key] = 0;
    }
}

function playerRestart() {
    // console.log('Player: ' + data.playerName + ' ready for new game.');
    dataSet = [];
    doorSize = null;
    showDoor = false;
    comments = [];
    allPlayers = {};
    score = {
        body: 0,
        soul: 0
    }
}
