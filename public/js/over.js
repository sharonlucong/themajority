var over = function(game) {}
var finalText;
var content = [
    "No more running away even in the bise",
    "No more desire for flowers however pretty",
    "Let me drift freely",
    "The sky grows higher, aspiration fades accordingly",
    "Whatever the karma I let it be",
    "I finally find a way out",
    "but what about you?"
];

var comments = [];

var line = [];

var wordIndex = 0;
var lineIndex = 0;

var wordDelay = 120;
var lineDelay = 400;

over.prototype = {
    init: function(score) {
        this.add.tileSprite(0, 0, 1920, 1920, 'background');
    },
    create: function() {
        $('#ending-inputs').show();
        $('#overInfo').show();
        $('#playInfo').hide();
        text = game.add.bitmapText(this.camera.width / 2, this.camera.height / 2 - 20, 'WebFont', '', 20);
        text.anchor.set(0.5);
        text.fixedToCamera = true;
        this.nextLine();

        var playButton = this.game.add.button(this.camera.width / 2, this.camera.height * 3 / 4, "btn", this.playTheGame, this);
        playButton.anchor.setTo(0.5, 0.5);

        this.textGroup = this.add.group();

        IO.socket.emit('updateComments');

    },

    update: function() {
        var that = this;
        IO.socket.on('showComments', function(data) {
            // console.log(data);

            that.textGroup.destroy(true, true);
            for (var i = 0; i < 10; i++) {
                that.textGroup.add(that.make.text(that.rnd.integerInRange(that.camera.width / 2 - 50, that.camera.width / 2 + 50), that.rnd.integerInRange(that.camera.height / 2 - 50, that.camera.height / 2 + 50), data[i], {
                    fontWeight: 'bold',
                    fontSize: '22px'
                }));
            }
        });
    },

    playTheGame: function() {
        location.reload();
    },

    nextLine: function() {

        if (lineIndex === content.length) {
            return;
        }
        line = content[lineIndex].split(' ');
        wordIndex = 0;
        this.time.events.repeat(wordDelay, line.length, this.nextWord, this);
        lineIndex++;
    },
    nextWord: function() {

        text.text = text.text.concat(line[wordIndex] + " ");
        wordIndex++;
        if (wordIndex === line.length) {
            text.text = text.text.concat("\n");
            game.time.events.add(lineDelay, this.nextLine, this);
        }
    }
}
