'use strict';
var game = new Phaser.Game(800, 320, Phaser.AUTO, "gameDiv", { preload: preload, create: create, update: update, render: render });
var player, startButton, isPlaying, isAlive, cursors, jumpButton, boxLayer, spider, reloadButton, livesText, gems, scoreText, timeText, isDying, projFireball;
var lives = 4;
var score = 0;
var spiderLife = 5;

var fireRate = 100;
var nextFire = 0;

var fireballSound;
var bgMusic;


function preload() {
	
	//images
	game.load.image('background', 'images/background.png');
	game.load.image('largeTrees', 'images/tree-64-192.png');
	game.load.image('smallTrees', 'images/tree-64-96.png');
	game.load.image('gem', 'images/gem.png');
	//spriteSheets
	game.load.spritesheet('player', 'images/idle_right_dead.png', 43, 48, 7);
    game.load.spritesheet('startButton', 'images/button.png', 120, 40);
    game.load.spritesheet('reloadButton', 'images/buttonReload.png', 120, 40);
    game.load.spritesheet('boxSheet', 'images/boxSheet.png', 32, 32);
	game.load.spritesheet('spider', 'images/spider.png', 42, 32, 5);
	//tileMaps
	game.load.tilemap('boxesCSV', 'data/BoxesTrees_boxes.csv', null, Phaser.Tilemap.CSV);
    game.load.tilemap('largeTreesCSV', 'data/BoxesTrees_trees.csv', null, Phaser.Tilemap.CSV);
    game.load.tilemap('smallTreesCSV', 'data/BoxesTrees_treesSmall.csv', null, Phaser.Tilemap.CSV);

    game.load.audio('fireballSound', 'data/fireballSound.mp3');
    game.load.audio('backgroundMusic', 'data/backgroundMusic.mp3');
    
	
	game.load.image('fireball','images/fireball.png');
}

function create() {

    fireballSound = game.add.audio('fireballSound');
    bgMusic = game.add.audio('backgroundMusic');
    
    //Move to Different Place
    game.physics.startSystem(Phaser.Physics.ARCADE);

    //Tracks if the games been open for 60 seconds
    setTimeout(function () { sendTracking("Timer", "Time", returnTimer()) }, 60000);

    //Background Creation
    var background = game.add.image(0, 0, 'background');
    var aspect = background.height / background.width;
    background.width = game.width;
    background.height = game.width * aspect;
    background.fixedToCamera = true;

    guiCreation();

    enviromentCreation();
    

    //Player Creation
    player = game.add.sprite(game.width / 2, game.height / 2, 'player');
    player.animations.add('idle', [0, 1, 2, 3, 4, 5], 12, true);
    player.animations.add('dead', [6], 12, true);
    player.animations.add('move', [5, 0], 12, true);
    player.animations.play('idle');
    player.anchor.setTo(0.5, 0);
    game.camera.follow(player, 0, 0.1, 0.1);

    //Enemy Creation
    spider = game.add.sprite(20, 20, 'spider');
    game.physics.enable(spider, Phaser.Physics.ARCADE);
    spider.animations.add('spiderMove', [0, 1, 2], 12, true);
    spider.animations.play('spiderMove');
    spider.body.collideWorldBounds = true;
    
    game.physics.arcade.gravity.y = 2000;
    game.physics.enable(player, Phaser.Physics.ARCADE);
    player.body.bounce.y = 0.2;
    player.body.collideWorldBounds = true;
    player.body.drag = new Phaser.Point(300, 0);
    player.body.setSize(player.width - 16, player.height - 3, 8, 2);


    //Creating the TileMap
    var boxMap = game.add.tilemap('boxesCSV', 32, 32);
    boxMap.addTilesetImage('boxSheet');
    boxLayer = boxMap.createLayer(0);
    boxLayer.resizeWorld();
    boxMap.setCollisionBetween(0, 100, true, boxLayer);

    

    gemCreation();

    

    projFireball = game.add.group();
    projFireball.enableBody = true;
    projFireball.physicsBodyType = Phaser.Physics.ARCADE;

    projFireball.createMultiple(5, 'fireball');

    projFireball.setAll('checkWorldBounds', true);
    projFireball.setAll('outOfBoundsKill', true);


    //StartButton
    startButton = game.add.button(340, 160, 'startButton', startGame, this, 1, 0, 2);
    cursors = game.input.keyboard.createCursorKeys();
    jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
}

//Time Elapsed in Seconds
 function returnTimer() {

    return Math.floor(game.time.totalElapsedSeconds());
}

function update() {

    game.physics.arcade.overlap(player, spider, doGameOver, doOverlapCheck, this);
    game.physics.arcade.collide(player, boxLayer);
    game.physics.arcade.collide(spider, boxLayer);
    
    game.physics.arcade.collide(gems, boxLayer);

    game.physics.arcade.overlap(projFireball, spider, doFireballCollision, doDestroyProjectile, this);
    game.physics.arcade.overlap(player, gems, collectGem, null, this);

    timeText.text = 'Elapsed seconds:' + returnTimer();
    

    if (isPlaying) {
        if (cursors.left.isDown) {
            player.body.velocity.x = -250;
            player.animations.play('move');
            player.scale.x = -1;
        }
        else if (cursors.right.isDown) {
            player.body.velocity.x = 250;
            player.animations.play('move');
            player.scale.x = 1;
        }
        if (score == 500) {
            if (window.addEventListener('keydown', function (event) {
                switch (event.keyCode) {
                    case 65: //This is "A" Key pressed
                        fire();
                        break;
                }
            }));
        } 
        
    }
    if (isPlaying && isAlive) {
        if (spider.x >= player.x) {
            spider.body.velocity.x -= 1;
        } else {
            spider.body.velocity.x += 1;
        }

        if (spider.body.blocked.right || spider.body.blocked.left) {
            spider.body.velocity.y = -300;
        }
    } 
        if (isPlaying && player.body.onFloor()) {


            if (jumpButton.isDown) {
                player.body.velocity.y = -500;
            }
        }







 }

function sendTracking(action, label, value)
{
    switch (action)
    {
        case "start":
            ga('send', 'event', 'boxGame', action);
            break;
        case "Spider Killed":
            ga('send', 'event', 'boxGame', action);
            break;
        case "Fireball Fired":
            ga('send', 'event', 'boxGame', action);
            break;
        default:
            ga('send', 'event', 'boxGame', action, label, value);
            break;
    }
}


//function ga(a, b, c, d, e, f) {

  //  console.log("track action = " + d + " label = " + e + " value = " + f);
//}
   

function render() {
    //game.debug.bodyInfo(spider, 32, 32);

    //game.debug.text('Active Bullets: ' + projFireball.countLiving() + ' / ' + projFireball.total, 32, 32);
}

function startGame(){
    startButton.destroy();
    isPlaying = true;
    isAlive = true;
    sendTracking("start");
    bgMusic.play();
}

function gemCreation() {
    gems = game.add.group();

    gems.enableBody = true;

    for (var i = 0; i < 50; i++) {

        var gem = gems.create(i * 70, 0, 'gem');

        gem.body.gravity.y = 6;
        gem.body.collideWorldBounds = true;

        gem.body.bounce.y = 0.7 + Math.random() * 0.2;
    }
}

function collectGem(player, gem) {

    gem.kill();

    score += 10;
    scoreText.text = 'Gems: ' + score;

}

function reloadGame() {
    reloadButton.destroy();
    spider.x = 20;
    spider.y = 20;
    player.x = game.width / 2;
    player.y = game.height / 2;
    
    lives += -1;
    livesText.text = 'lives: ' + lives;
    sendTracking("restart", "lives", lives);
    isPlaying = true;
    isDying = false;
}


function gameOverCheck() {
    


    if (lives == 1) {
        alert("Game Over");
        location.reload();
    }
    else {
        reloadGame()
    }
}

function doGameOver()
{
    if (lives == 1) {
        alert("Game Over");
        location.reload();
    } else {
        if (!isDying) {
            sendTracking("die", "Score", score);
            player.animations.play('dead');
            if (player.body.velocity.x > 0) {
                player.body.velocity.x = 0;
            }
            spider.body.velocity.x = 0;
            isPlaying = false;
            reloadButton = game.add.button(player.x + -60, player.y + -50, 'reloadButton', gameOverCheck, this, 1, 0, 2);
            //game.paused = true;
            isDying = true;

        }
    }

    //alert("Game Over");
    //location.reload();
}

function doOverlapCheck() {

    if (spider.x == 20 && player.x == game.width / 2) {
        return false
    } else {
        return true
    }
}

function fire() {

    if (game.time.now > nextFire && projFireball.countDead() > 0) {
        
        nextFire = game.time.now + fireRate;

        var fireball = projFireball.getFirstDead();

        fireball.body.allowGravity = false;
        fireballSound.play();

        fireball.reset(player.x -8, player.y- 12);

        //game.physics.arcade.moveToXY(fireball, playerX, player.y, 200);
        game.physics.arcade.moveToObject(fireball, spider,  200);

        
        sendTracking("Fireballs Fired");
    }
}

function guiCreation() {
    //Score Text in the top left
    scoreText = game.add.text(16, 16, 'Gems: 0', { fontSize: '32px', fill: '#000' });
    scoreText.fixedToCamera = true;

    //Lives Left Text top right
    livesText = game.add.text(605, 16, 'lives:' + lives, { fontSize: '32px', fill: '#000' });
    livesText.fixedToCamera = true;

    //Time elapsed center screen top
    timeText = game.add.text(240, 16, 'Elapsed seconds:' + returnTimer(), { fontSize: '32px', fill: '#000' });
    timeText.fixedToCamera = true;
}

function enviromentCreation() {
    var smalltreeMap = game.add.tilemap('smallTreesCSV', 32, 32);
    smalltreeMap.addTilesetImage('smallTrees');
    var smalltreeLayer = smalltreeMap.createLayer(0);
    smalltreeLayer.scrollFactorX = 0.25;

    var treeMap = game.add.tilemap('largeTreesCSV', 32, 32);
    treeMap.addTilesetImage('largeTrees');
    var treeLayer = treeMap.createLayer(0);
    treeLayer.scrollFactorX = 0.5;
}

function doFireballCollision() {
    spider.destroy();
    isAlive = false;
    sendTracking("Spider Killed");
}

function doDestroyProjectile(projFireball) {
    projFireball.destroy();
}
