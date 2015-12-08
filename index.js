// Import the Express module
var express = require('express');

// Import the Path module
var path = require('path');

// Create a new Express application
var app = express();

// Create an http server with Node's HTTP module. 
// Pass it the Express application, and listen on port 8080. 
var server = require('http').createServer(app).listen(8888);

// Instantiate Socket.IO hand have it listen on the Express/HTTP server
var io = require('socket.io').listen(server);

// Current online people numbers
var onlineCount = 0;

//All of ther server-side code specific to the game is in game.server.js.
var gameServer = require('./game.js');

// Create a simple Express application
app.configure(function() {

    // Serve static html, js, css, and image files from the 'public' directory
    app.use(express.static(path.join(__dirname,'public')));
});

// Reduce the logging output of Socket.IO
io.set('log level',1);

var ROWS = 30;
var COLS = 30;
var map;

function initMap() {
    // create a new random map
    map = [];
    for (var y = 0; y < ROWS; y++) {
        var newRow = [];
        for (var x = 0; x < COLS; x++) {
            if (Math.random() > 0.6)
                newRow.push('#');
            else
                newRow.push('.');
        }
        map.push(newRow);
    }
}

initMap();



var clients = [];
var dir = {
    up: 0,
    left: 0,
    right: 0,
    none: 0
};

io.sockets.on('connection', function (socket) {
    gameServer.initGame(io, socket, clients.length, dir,map);
    clients.push(socket);    

    socket.on('disconnect', function(){
    	clients.splice(clients.indexOf(socket), 1);
    	gameServer.leaveGame(io, socket, clients.length);
    });

});
