var game;

var IO = {
    /**
     * This is called when the page is displayed. It connects the Socket.IO client
     * to the Socket.IO server
     */
    init: function() {

        IO.socket = io.connect();
        IO.bindEvents();
    },

    bindEvents: function() {
        IO.socket.on('connected', IO.onConnected);
        IO.socket.on('newGameCreated', IO.onNewGameCreated);

        IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom);
        IO.socket.on('beginNewGame', IO.beginNewGame);

        IO.socket.on('showD3Chart', IO.showD3Chart);
        IO.socket.on('generateDoor', IO.hostGenerateDoor);

        IO.socket.on('updateCurNum', IO.updateCurNum);

        IO.socket.on('hostMoveCharacter', IO.hostMoveCharacter);
        IO.socket.on('gameOver', IO.gameOver);
        IO.socket.on('error', IO.error);

        IO.socket.on('getCharacterPos', IO.onGetCharacterPos);
        IO.socket.on('disconnected', IO.onDisconnected);
        IO.socket.on('gameEndingScene', IO.gameOver);


        IO.socket.on('initMap', IO.onInitMap);
        IO.socket.on('playerMoveDir', IO.onPlayerMoveDir);
        IO.socket.on('showScore', IO.showScore);
       
        IO.socket.on('updateOthersPos', IO.updateOthersPos);
    },

    onConnected: function(data) {
        // Cache a copy of the client's socket.IO session ID on the App
       // App.mySocketId = IO.socket.socket.sessionid;
        App.mySocketId = data.id;
        App.Host.numPlayersInRoom = data.count;
        // App.$pplNum.html(App.Host.numPlayersInRoom);
        App.Host.characterPos = data.charPos;
        App.Host.map = data.newMap;

        App.Host.doorInfo = data.doorInfo;

        if (data.count === 0) {
            App.Host.isNewGame = false;
        } else {
            App.Host.isNewGame = true;
        }

        IO.showScore(data.score);
        App.Host.score = data.score;
        
    },

    updateCurNum: function(data){
        console.log(data);
        App.Host.numPlayersInRoom = data;
        App.$pplNum.html(App.Host.numPlayersInRoom);
    },

    onDisconnected: function(data) {
        App.Host.numPlayersInRoom = data.count;
        App.$pplNum.html(App.Host.numPlayersInRoom);
    },

    showD3Chart: function(data) {
        App.Host.dataSet = data;
        App.Host.drawD3Chart(data);
    },

    onInitMap: function(data) {
        App.Host.map = data;
    },

    onPlayerMoveDir: function(data) {
        App.Player.direction = data;
    },

    onNewGameCreated: function(data) {
        // console.log("onNewGameCreated");
        // App.Host.gameInit(data);
    },

    playerJoinedRoom: function(data) {
        App.Host.numPlayersInRoom = data.numPlayersInRoom;
        App.$pplNum.html(App.Host.numPlayersInRoom);
    },

    beginNewGame: function(data) {
        App[App.myRole].gameCountdown(data);
    },

    onGetCharacterPos: function(data) {
        App.Host.characterPos = data;
    },

    hostMoveCharacter: function(data) {
        App.Host.moveCharacter(data);
    },

    showScore: function(data) {
        App.Host.score = data;
        App.$bval.html(data.body);
        App.$sval.html(data.soul);
        App.$ssize.html((soulSize*64).toFixed(2));
    },

    hostGenerateDoor: function(data) {
        App.Host.doorInfo = data;
    },

    /**
     * Let everyone know the game has ended.
     * @param data
     */
    gameOver: function(data) {
        // App[App.myRole].endGame(data);
        App.Host.endGame(data);
    },
	
    updateOthersPos: function(data){
        App.Host.otherPlayerPos = data;
    },
    /**
     * An error has occurred.
     * @param data
     */
    error: function(data) {
        alert(data.message);
    }

};

var App = {

    gameId: 0,

    myRole: '', // 'Player' or 'Host'

    mySocketId: '',

    currentRound: 0,

    /**
     * This runs when the page initially loads.
     */
    init: function() {
        App.cacheElements();
        App.showInitScreen();

        App.bindEvents();
    },

    cacheElements: function() {
        App.$doc = $(document);
        // Templates
        App.$gameArea = $('#gameDiv');
        App.$templateIntroScreen = $('#intro-screen-template').html();
        App.$templateWaitGame = $('#wait-game-template').html();
        App.$btnGroup = $('#game-btn-group').html();

        App.$bval = $('#bval');
        App.$sval = $('#sval');
        App.$ssize = $('#ssize');
        App.$pplNum = $('#people');
    },

    bindEvents: function() {

        App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
        App.$doc.on('click', '#btnReturn', App.showInitScreen);
        App.$doc.on('click', '#inputComment', function(){
            $('#inputComment').prompt();
        });
        App.$doc.on('click', '#btnComments', App.addComments);
    },

    showInitScreen: function() {
        App.$gameArea.html(App.$templateIntroScreen);
        App.doTextFit('.title');
        $('#ending-inputs').hide();
        //show game controller btns
        $('.game-btns').css({
            "display": "none"
        });

        $('#playInfo').hide();

        $('.chart-titles').css({
            "visibility": "hidden"
        });

        $('.chart').css({
            "display": "none"
        });
        $('#overInfo').hide();
    },

    addComments:function(){
        var comment = $('#inputComment').val();
        if(comment){
            IO.socket.emit('updateComments', comment);
        }
        $('#inputComment').val("");
    },

    Host: {

        players: [],
       
       updateOthersPos: {},

        map: [],

        isNewGame: true,

        numPlayersInRoom: 0,

        characterPos: {
            x: 0,
            y: 0
        },

        score: {
            body: 0,
            soul: 0
        },

        end: false,

        dataSet: [10, 50, 60, 80],

        doorInfo: null,

        getDir: function(set){
            var max = Math.max(App.Host.dataSet[0], App.Host.dataSet[1], App.Host.dataSet[2]);
            if(max == 0){
                return -1;
            }
            return set.indexOf(max);
        },

        gameInit: function(data) {

        },

        displayNewGameScreen: function() {

            if (App.Host.numPlayersInRoom >= 15) {

                App.$gameArea.html(App.$templateWaitGame);
                $('#total').html(App.Host.numPlayersInRoom);


            } else {

                App.$gameArea.html("");
                IO.socket.emit('addNewPlayer', App.mySocketId);
                App.Host.numPlayersInRoom = App.Host.numPlayersInRoom+1;
                
                IO.socket.emit('updateCurrentNum', App.Host.numPlayersInRoom);
                
                // App.Host.numPlayersInRoom = data.count + 1;
                App.$pplNum.html(App.Host.numPlayersInRoom);

                // Create a game in the 'gameDiv' element of the index.html
                game = new Phaser.Game(window.innerWidth, window.innerHeight * 2 / 3, Phaser.AUTO, 'gameDiv');
                // Add the 'mainState' to Phaser, and call it 'main'
                game.state.add('main', mainState);
                game.state.add("GameOver",over);
                game.state.start('main');

                //show game controller btns
                $('.game-btns').css({
                    "display": "block"
                });

                $('.chart-titles').css({
                    "visibility": "visible"
                });

                $('.chart').css({
                    "display": "block"
                });
                $('#playInfo').show();
                //d3 initialize

                var x = d3.scale.linear()
                    .domain([0, d3.max(App.Host.dataSet)])
                    .range([0, 100]);

                d3.select(".chart")
                    .selectAll("div")
                    .data(App.Host.dataSet)
                    .enter()
                    .append("div")
                    .style("width", function(d) {
                        return x(d) + "px";
                    })
                    .text(function(d) {
                        return d;
                    });

            }

        },

        drawD3Chart: function(dt) {
            var x = d3.scale.linear()
                .domain([0, d3.max(dt)])
                .range([0, 100]);
            d3.select(".chart").selectAll("div")
                .data(dt)
                .style("width", function(d) {
                    return x(d) + "px";
                })
                .text(function(d) {
                    return d;
                });
        },

        // setCharacterPosition: function(pos) {

        // },

        // getCharacterPosition: function() {

        // },

        updateWaitingScreen: function(data) {
            // If this is a restarted game, show the screen.
            if (App.Host.isNewGame) {
                console.log("this is a restarted");
                App.Host.displayNewGameScreen();
            }
            // Update host screen
            $('#playersWaiting')
                .append('<p/>')
                .text('Player ' + data.playerName + ' joined the game.');

            // Store the new player's data on the Host.
            App.Host.players.push(data);

            // Increment the number of players in the room
            App.Host.numPlayersInRoom += 1;

            // If two players have joined, start the game!
            if (App.Host.numPlayersInRoom === 3) {
                console.log('Room is full. Almost ready!');

                // Let the server know that two players are present.
                IO.socket.emit('hostRoomFull', App.gameId);
            }
        },

        moveCharacter: function(data) {
            // console.log("data", data);
            game.state.states.main.playerPosition(data.h, data.v);
            // game.state.states.main.move = data;
        },

        endGame: function(data) {
            App.Host.end = data;
            if(game){
                game.state.start('GameOver',true,false,10);
            }

            // Reset game data
            App.Host.numPlayersInRoom = 0;
            App.Host.isNewGame = true;
        },

        restartGame: function() {
            App.$gameArea.html(App.$templateNewGame);
            $('#spanNewGameCode').text(App.gameId);
        }
    },

    Player: {

        hostSocketId: '',

        fired: false,

        myName: '',

        direction: 'none',

        onJoinClick: function() {
            // Display the Join Game HTML on the player's screen.
            App.Host.displayNewGameScreen();
            App.Player.onPlayerStartClick();
        },

        onPlayerStartClick: function() {

            var data = {
                numPlayersInRoom: App.Host.numPlayersInRoom
            }

            // Send the gameId and playerName to the server
            IO.socket.emit('playerJoinGame', data);
        },

        onPlayerMove: function(e) {

            IO.socket.emit('playerMove', 1);

        }
    },

    /**
     * Make the text inside the given element as big as possible
     * See: https://github.com/STRML/textFit
     *
     * @param el The parent element of some text
     */
    doTextFit: function(el) {
        textFit(
            $(el)[0], {
                alignHoriz: true,
                alignVert: false,
                widthOnly: true,
                reProcess: true,
                maxFontSize: 300
            }
        );
    }

};

IO.init();
App.init();
