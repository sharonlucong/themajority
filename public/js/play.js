//the play state
var height = window.innerHeight;
var width = window.innerWidth;

// map dimensions
var ROWS = 30;
var COLS = 30;

var left = false;
var right = false;
var up = false;
var down = false;

var map;
var asciidisplay;

var wait = false;
var factor = 1;

var showDoor = false;

var soulSize = 1;

var lJump = true;

var emitter;
var key1;
var key2;

var soulHints = ['star might help', 'I just follow the behaviors of majority', 'I want to escape', 'my size matthers'];
var showSoulHints = false;

var fx;

function isEmpty(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop))
            return false;
    }

    return true;
}

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

    IO.socket.emit('hostInitMap', {
        newMap: map
    });
}

function generateSprites() {

    this.coin = game.add.sprite(this.game.world.centerX - 100, this.game.world.centerY - 100, 'coin');
    this.physics.arcade.enable(this.coin);
    this.coin.anchor.setTo(0.5, 0.5);

}

var mainState = {

    preload: function() {

        game.stage.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

        this.game.load.spritesheet('player', 'assets/player/playerAnim.png', 64, 64);
        this.game.load.spritesheet('player1', 'assets/player/playerAnim1.png', 64, 64);

        this.load.image('background', 'assets/images/paper_texture.jpg');

        this.load.image('brick', 'assets/images/wall.png', 20, 200);
        this.load.image('brickV', 'assets/images/wallV.png', 20, 200);

        this.load.image('coin', 'assets/images/coin.png', 32, 32);
        this.load.image('crown', 'assets/images/crown.png', 32, 32);
        this.load.image('star', 'assets/images/star.png', 32, 32);

        this.load.image('door', 'assets/images/door.png', 64, 128);

        this.load.bitmapFont('WebFont', 'assets/font/font.png', 'assets/font/font.fnt');

        this.load.image('btn', 'assets/images/btn.png', 64, 32);

        this.load.image('diamond', 'assets/images/white.png');

        this.load.spritesheet('buttonLeft', 'assets/leftButton.png', 32, 32);
        this.load.spritesheet('buttonRight', 'assets/rightButton.png', 32, 32);
        this.load.spritesheet('buttonUp', 'assets/jumpButton.png', 32, 32);

        this.load.audio('bgmusic', ['assets/starry-night.ogg', 'assets/starry-night.mp3']);
        this.load.audio('sfx', ['assets/fx_mixdown.ogg', 'assets/fx_mixdown.mp3']);

    },
    create: function() {
        // This function is called after the preload function 
        // Here we set up the game, display sprites, etc. 

        this.physics.startSystem(Phaser.Physics.ARCADE);
        this.world.setBounds(0, 0, 1920, 1920);
        this.add.tileSprite(0, 0, 1920, 1920, 'background');
        this.levelGroup = this.add.group();
        

        this.otherPlayers = this.add.group();
       // if (App.Host.numPlayersInRoom === 1) {

            this.charPos = {
                x: 70,
                y: this.world.height - 70
            };
            // initialize map
       //     initMap();
       // } else {
         //   this.charPos = App.Host.characterPos;
            map = App.Host.map;
       // }

        this.doorHint = this.add.bitmapText(100, 100, 'WebFont', 'Portal Appears', 32);
        this.doorHint.anchor.set(0.5);
        this.doorHint.fixedToCamera = true;
        this.add.tween(this.doorHint.cameraOffset).to({
            y: window.innerHeight / 4 - 50
        }, 2000, Phaser.Easing.Back.InOut, true, 0, 2000, true);
        this.doorHint.visible = false;


        this.endingHint = this.add.bitmapText(this.camera.width / 2, this.camera.height / 2, 'WebFont', 'soul glutted with material,\n find things to shrink it', 32);
        this.endingHint.anchor.set(0.5);
        this.endingHint.fixedToCamera = true;
        this.add.tween(this.endingHint.cameraOffset).to({
            y: window.innerHeight / 4 - 50
        }, 2000, Phaser.Easing.Back.InOut, true, 0, 2000, true);
        this.endingHint.visible = false;


        // Create a local variable
        this.player = this.game.add.sprite(this.charPos.x, this.charPos.y, 'player');
        this.player1 = this.game.add.sprite(this.charPos.x + 100, this.charPos.y, 'player1');
        this.player1.tint = Math.random() * 0xffffff;

        idleAnim = this.player.animations.add('idleAnim', [0], 0, true);
        leftAnim = this.player.animations.add('leftAnim', [1, 2, 3, 4, 5], 10, true);
        rightAnim = this.player.animations.add('rightAnim', [10, 9, 8, 7, 6], 10, true);
        jumpLeftAnim = this.player.animations.add('jumpLeftAnim', [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], 10, true);
        jumpRightAnim = this.player.animations.add('jumpRightAnim', [30, 29, 28, 27, 26, 25, 24, 23, 22, 21], 10, true);

        this.player1.animations.add('idleAnim', [0], 0, true);
        this.player1.animations.add('leftAnim', [1, 2, 3, 4, 5], 10, true);
        this.player1.animations.add('rightAnim', [10, 9, 8, 7, 6], 10, true);
        this.player1.animations.add('jumpLeftAnim', [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], 10, true);
        this.player1.animations.add('jumpRightAnim', [30, 29, 28, 27, 26, 25, 24, 23, 22, 21], 10, true);

        this.player.anchor.setTo(0.5, 0.5);
        this.player1.anchor.setTo(0.5, 0.5);
        this.game.camera.follow(this.player);


        // Tell Phaser that the player will use the Arcade physics engine
        this.physics.arcade.enable(this.player);
        // this.physics.arcade.enable(this.player1);
        this.player.body.collideWorldBounds = true;
        this.player.body.gravity.y = 300; // Add vertical gravity to the player

        this.player.body.setSize(30, 64, 0, 0);

        // Create our wall group with Arcade physics 
        this.walls = this.add.group();
        this.walls.enableBody = true;

        this.coins = this.add.group();
        this.crowns = this.add.group();
        this.stars = this.add.group();

        this.stars.enableBody = true;
        this.coins.enableBody = true;
        this.crowns.enableBody = true;


        // initialize screen and draw map
        for (var x = 1; x < ROWS; x++) {
            for (var y = 0; y < COLS; y++) {
                if (map[x][y] === '.') {
                    this.add.sprite(200 * y, x * 180, 'brick', 0, this.walls);
                }
            }
        }

        //initalize sprites
        for (var x = 1; x < ROWS; x++) {
            for (var y = 1; y < COLS; y++) {
                if (map[x][y] === '.' && y % 3 === 0) {
                    if (x / 5 < 1.5) {
                        this.add.sprite(y * 64, x * 100 + 40, 'star', 0, this.stars);

                    } else if (x / 5 < 3) {
                        this.add.sprite(y * 64, x * 100 + 40, 'crown', 0, this.crowns);
                    } else {
                        this.add.sprite(y * 64, x * 100 + 40, 'coin', 0, this.coins);
                    }
                }
            }
        }



        this.createWorld();
        this.walls.setAll('body.immovable', true);
        this.createBtnGroups();


        key1 = this.input.keyboard.addKey(Phaser.Keyboard.ONE);
        key1.onDown.add(this.generateMap, this);

        key2 = this.input.keyboard.addKey(Phaser.Keyboard.TWO);
        key2.onDown.add(this.gotoEnd, this);

        this.levelGroup.add(this.doorHint);
        this.initTextHints();

        this.time.events.add(1000, this.updateHints, this);


        if (this.game.device.firefox) {
            console.log("this is firefox");
        } else {
            console.log("this is not firefox");
            music = game.add.audio('bgmusic');
            music.loop = true;

            music.play();
        }


        fx = game.add.audio('sfx');
        fx.allowMultiple = true;

        fx.addMarker('alien death', 1, 1.0);
        fx.addMarker('shot', 17, 1.0);
        fx.addMarker('squit', 19, 0.3);
	
	if (window.screen.width > 1000) {
            var toplayer = this.add.tileSprite(0, 0, 1920, 1920, 'background');
            toplayer.alpha = 0.2;
            toplayer.tint = 0x6b6b6b;
            var style = { font: "50px Quicksand", fill: "#ffffff", align: "center" };
            var Screentext = game.add.text(this.camera.width / 2, this.camera.height / 2, "- Play with your phone -\n It only follows what\nmajority does", style);
            Screentext.fixedToCamera = true;
            Screentext.alpha = 0.7;
            Screentext.tint = 0x2b2b2b;
            Screentext.anchor.set(0.5);
            this.time.events.add(2000, this.updateOthers, this);
        }
    },

    update: function() {
        // This function is called 60 times per second 
        // this.endingHint.visible = false;
        if (App.Host.score.body > App.Host.score.soul) {
            soulSize = (App.Host.score.body - App.Host.score.soul) * 0.05 + 1;
            if (soulSize > 5.5) {
                soulSize = 5.5;
            }
        } else {
            if (soulSize > 1) {
                soulSize = soulSize - 1;
            } else {
                soulSize = 1;
                this.doorHint.visible = false;
                if (this.door) {
                    this.door.destroy();
                }
                // 
            }
        }

        if (showDoor) {
            this.doorHint.visible = true;
            // this.game.world.remove(this.door);
            // this.door.destroy();
            // console.log(this);
            // this.door.parent.remove(this.door);
            // console.log("this.door exist?", this.door);
            // showDoor = false;
        }



        this.physics.arcade.collide(this.player, this.walls);

        if (this.door) {
            // this.physics.arcade.collide(this.player, this.door);
            this.physics.arcade.collide(this.player, this.door, this.checkEnding, null, this);
            // this.physics.arcade.overlap(this.player, this.stars, this.takeSprite, null, this);
        }
/*        var that = this;
        if (!wait) {
            wait = true;
            setTimeout(function() {
                that.player.position = App.Host.characterPos;
                wait = false;
            }, 5000);
        }
*/
        IO.socket.on('playerRestartGame', function() {
            that.game.state.start('main');
        });

        this.player1.scale.setTo(soulSize, soulSize);

        this.physics.arcade.overlap(this.player, this.stars, this.takeSprite, null, this);
        this.physics.arcade.overlap(this.player, this.coins, this.takeSprite, null, this);
        this.physics.arcade.overlap(this.player, this.crowns, this.takeSprite, null, this);



        if (App.Player.direction == 'none') {

            this.player.body.velocity.x = 0;
            this.player.animations.play('idleAnim');

            this.player1.animations.play('idleAnim');

        } else if (App.Player.direction == 'left') {

            this.player.body.velocity.x = -100;
            this.player.animations.play('leftAnim');
            factor = 1;


            this.player1.animations.play('leftAnim');

        } else if (App.Player.direction == 'right') {

            this.player.body.velocity.x = 100;
            this.player.animations.play('rightAnim');
            factor = -1;

            this.player1.animations.play('rightAnim');

        } else if (App.Player.direction == 'up') {

            this.player.body.velocity.y = -250;
            if (lJump) {

                this.player.animations.play('jumpLeftAnim');
                this.player1.animations.play('jumpLeftAnim');

            } else {

                this.player.animations.play('jumpRightAnim');
                this.player1.animations.play('jumpRightAnim');
            }

        }

        this.player1.position.y = this.player.position.y;
        this.player1.position.x = this.player.position.x + 80 * factor;
        App.Player.onPlayerMove();
       // IO.socket.emit("setPlayerPos", this.player.position);
        IO.socket.emit("setPlayerPos", {
            pos: this.player.position,
            id: App.mySocketId
        });

        if (App.Host.doorInfo && App.Host.doorInfo.dSize) {
            console.log("door appears");
            this.generateDoor(App.Host.doorInfo.dX, App.Host.doorInfo.dY, App.Host.doorInfo.dSize);
            App.Host.doorInfo = null;
            showDoor = true;
        }

        this.setBtnHint(App.Host.getDir(App.Host.dataSet));

        if (showSoulHints) {
            var that = this;
            setTimeout(function() {
                that.soultext.visible = false;
                showSoulHints = false;
            }, 1000);
        }

        this.soultext.x = Math.floor(this.player1.x);
        this.soultext.y = Math.floor(this.player1.y);


    },

    checkEnding: function(player, sprite) {
        console.log("doorsize", sprite.body.height);
        console.log('playerSize', soulSize * 64);
        console.log(this.player1);
        if (soulSize * 64 > sprite.body.height) {
            this.endingHint.visible = true;
            var that = this;
            setTimeout(function() {
                that.endingHint.visible = false;
            }, 5000)
        } else {
            //go to the end scene and restart the game
            IO.socket.emit('hostEndGame', true);
            $('#ending-inputs').show();
            this.game.state.start("GameOver", true, false, 10);
        }

    },

    playerPosition: function(x, y) {
        this.player.body.velocity.x = x * 50;
        this.player.body.velocity.y = y * 50;
    },

    takeSprite: function(player, sprite) {

        this.particleBurst(sprite.key);
        this.generateHints(sprite.key);

        this.triggerSound(sprite.key);

        IO.socket.emit('setScore', {
            key: sprite.key,
            show: showDoor
        });
        // Define 2 random variables
        var newX = this.rnd.integerInRange(1, ROWS);
        var newY = this.rnd.integerInRange(1, COLS);
        // Set the new coin position
        sprite.reset(newY * 32, newX * 100 + 40);

    },

    triggerSound: function(key) {
        if (key === 'coin') {
            fx.play('alien death');
        } else if (key === 'crown') {
            fx.play('shot');
        } else {
            fx.play('squit');
        }
    },

    particleBurst: function(color) {
        emitter = this.add.emitter(0, 0, 100);
        emitter.width = 1920;

        emitter.makeParticles('diamond');

        emitter.forEach(function(particle) {
            // tint every particle red
            if (color == 'crown') {
                particle.tint = 0xff0000;
            } else if (color == 'star') {
                particle.tint = 0xeeeeee;
            } else {
                particle.tint = 0xffe032;
            }

        });

        emitter.setAlpha(0.3, 0.8);
        emitter.maxParticleScale = 0.5;
        emitter.minParticleScale = 0.1;
        emitter.setXSpeed(-5, 5);
        emitter.gravity = 200;

        emitter.minRotation = 0;
        emitter.maxRotation = 0;
        emitter.x = this.player.position.x;
        emitter.y = this.player.position.y - 200;
        emitter.start(true, 2000, null, 10);
    },
    updateOthers: function(){
        if (!isEmpty(App.Host.otherPlayerPos)) {
            // console.log(App.Host.otherPlayerPos);
            if (this.otherPlayers) {
                this.otherPlayers.removeAll();
                // for (var obj in this.otherPlayers.children) {
                //     this.otherPlayers.remove(obj);
                // }
                //             this.otherPlayers.removeAll(false, false);
            }
            for (var key in App.Host.otherPlayerPos) {
                // console.log(App.Host.otherPlayerPos);
                // console.log(App.mySocketId);

                if (App.Host.otherPlayerPos[key]) {
                    if(key !== App.mySocketId){
                        this.otherPlayers.create(App.Host.otherPlayerPos[key].x, App.Host.otherPlayerPos[key].y, 'player1');
                    }
                    
                }

            }

        }

        this.time.events.add(2000, this.updateOthers, this);
    },
    updateHints: function() {

        this.soultext.text = soulHints[this.rnd.integerInRange(0, 3)];
        this.soultext.visible = true;
        this.time.events.add(2000, this.removeHints, this);
    },

    removeHints: function() {
        this.soultext.visible = false;
        this.time.events.add(10000, this.updateHints, this);
    },

    generateDoor: function(x, y, size) {

        // this.door = this.add.sprite(this.rnd.integerInRange(200, this.game.world.width-200), this.rnd.integerInRange(200, this.game.world.height-200), 'door');
        // console.log('rege');
        this.door = this.add.sprite(x, y, 'door');
        this.door.scale.setTo(size * 0.02, size * 0.02);
        this.physics.arcade.enable(this.door);
        this.door.body.immovable = true;

        this.doorHint.visible = true;
        showDoor = true;
        this.levelGroup.add(this.door);
    },

    createWorld: function() {
        for (var i = 0; i < 10; i++) {
            this.add.sprite(0, i * 200, 'brickV', 0, this.walls);
            this.add.sprite(1900, i * 200, 'brickV', 0, this.walls);
            this.add.sprite(i * 200, 0, 'brick', 0, this.walls);
            this.add.sprite(i * 200, 1900, 'brick', 0, this.walls);
        }

    },

    generateMap: function() {
        initMap();
        music.destroy();
        IO.socket.emit("restartGame");
        // this.game.state.start('main');
        // console.log('function called');
    },

    gotoEnd: function() {
        IO.socket.emit('hostEndGame', true);
        // this.game.state.start('GameOver');
    },

    setBtnHint: function(dir) {
        buttonleft.tint = 0xffffff;
        buttonright.tint = 0xffffff;
        buttonup.tint = 0xffffff;

        if (dir == 0) {
            buttonleft.tint = 0xff583c;
        } else if (dir == 1) {
            buttonright.tint = 0xff583c;
        } else if (dir == 2) {
            buttonup.tint = 0xff583c;
        }
    },

    createBtnGroups: function() {
        buttonleft = this.add.button(this.camera.width / 2 + 32, this.game.height - 32, 'buttonLeft', null, this, 0, 1, 0, 1);
        buttonleft.fixedToCamera = true;
        buttonleft.events.onInputOver.add(function() {
            left = false;
        });
        buttonleft.events.onInputOut.add(function() {
            left = false;
        });
        buttonleft.events.onInputDown.add(function() {
            left = true;
            lJump = true;
            IO.socket.emit("pressLeft", 'left');

        });
        buttonleft.events.onInputUp.add(function() {
            left = false;
        });

        buttonright = this.add.button(this.camera.width / 2 + 96, this.game.height - 32, 'buttonRight', null, this, 0, 1, 0, 1);
        buttonright.fixedToCamera = true;
        buttonright.events.onInputOver.add(function() {
            right = false;

        });
        buttonright.events.onInputOut.add(function() {
            right = false;
        });
        buttonright.events.onInputDown.add(function() {
            right = true;
            lJump = false;
            IO.socket.emit("pressRight", 'right');
        });
        buttonright.events.onInputUp.add(function() {
            right = false;
        });

        buttonup = this.add.button(this.camera.width / 2 + 64, this.game.height - 64, 'buttonUp', null, this, 0, 1, 0, 1);
        buttonup.fixedToCamera = true;
        buttonup.events.onInputOver.add(function() {
            up = false;
        });
        buttonup.events.onInputOut.add(function() {
            up = false;
        });
        buttonup.events.onInputDown.add(function() {
            up = false;
        });
        buttonup.events.onInputUp.add(function() {
            up = true;
            IO.socket.emit("pressUp", 'up');
        });
    },

    initTextHints: function() {
        var style = {
            font: "16px Arial",
            fill: "#393939",
            wordWrap: true,
            wordWrapWidth: this.player1.width,
            align: "center"
        };

        this.soultext = game.add.text(0, 0, "", style);
        this.soultext.anchor.set(0.5);
    },

    generateHints: function(key) {
        showSoulHints = true;

        if (key === 'coin' || key === 'crown') {
            this.soultext.text = 'I am stretched';
        } else if (key === 'star') {
            this.soultext.text = 'I am shrunken';
        }

        this.soultext.visible = true;

    },

    render: function() {
        // this.game.debug.body(this.player);
    }


};
