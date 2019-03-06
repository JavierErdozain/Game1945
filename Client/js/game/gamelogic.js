define('gamelogic',[
    'game',
    'gameconfig',
    'gamesocket',
    'gamelevelparameters',
    'gamejoystick'],
function (game,config,gamesocket,levelparams,gamejoystick){
  return{

    flipflopfire : false,
    enemys:[],
    joystick:{},
    preload: function () {
      this.load.image('sea', 'static/assets/sea.png');
      this.load.image('bullet', 'static/assets/bullet.png');
      this.load.image('enemyBullet', 'static/assets/enemy-bullet.png');
      this.load.spritesheet('greenEnemy', 'static/assets/enemy.png', 32, 32);
      this.load.spritesheet('whiteEnemy', 'static/assets/shooting-enemy.png', 32, 32);
      this.load.spritesheet('explosion', 'static/assets/explosion.png', 32, 32);
      this.load.spritesheet('player', 'static/assets/player.png', 64, 64);
      //this.load.audio('GameMusic', ['static/assert/La Polla Records - Johnny.ogg']);
    },
    create: function () {
      this.keys = this.game.input.keyboard.createCursorKeys();
      this.joystick=gamejoystick.getjoystick();
      this.setupBackground();
      this.setupPlayers();
      this.setupExplosions();
      this.setuplogs();

      // Barra superior de objetos. Vidas, puntuación, etc.
      this.setupScore();
      this.setupPlayerIcons();

      this.stage.disableVisibilityChange = true;

      // Comunicación socket.
      gamesocket.connect();
      gamesocket.socket.on('connect', function(data) {
        gamesocket.token=gamesocket.socket.id;
          console.log('connection established');
      });
      gamesocket.socket.on('playerspositions', function(data) {
          levelparams=JSON.parse(data);
      });

      // Configuración del botón disparo. Evitamos rafagas.
      this.joystick.keyfire.onDown.add(function(){gamesocket.socket.emit('client.fire',gamesocket.token);}, this);

    },
    update: function () {
      //this.spawnEnemies();
      this.updateplayers();
      this.updateenemys();
      this.updateexplosions();
      this.processPlayerInput();
      this.updatelogs();
      this.updateScore();
      //this.processDelayedEffects();
    },

    setupBackground: function () {
      this.sea = this.add.tileSprite(0, 0, this.game.width, this.game.height, 'sea');
      this.sea.autoScroll(0, config.SEA_SCROLL_SPEED);
    },
    setupPlayers: function () {
      this.players=[];
    },
    setuplogs: function(){
      this.logs = this.add.text(this.game.width / 2, 230,
       'Jugadores:',
       { font: '10px monospace', fill: '#fff', align: 'center' }
      );
      this.logs.anchor.setTo(0.5, 0.5);
      //this.instExpire = this.time.now + config.INSTRUCTION_EXPIRE;
      //this.score = 0;
      //this.scoreText = this.add.text(
      //  this.game.width / 2, 30, '' + this.score,
      //  { font: '20px monospace', fill: '#fff', align: 'center' }
      //);
      //this.scoreText.anchor.setTo(0.5, 0.5);
    },
    setupExplosions: function () {
      this.explosionPool = this.add.group();
      this.explosionPool.enableBody = true;
      this.explosionPool.physicsBodyType = Phaser.Physics.ARCADE;
      this.explosionPool.createMultiple(100, 'explosion');
      this.explosionPool.setAll('anchor.x', 0.5);
      this.explosionPool.setAll('anchor.y', 0.5);
      this.explosionPool.forEach(function (explosion) {
        explosion.animations.add('boom');
      });
    },
    setupScore:function(){
      this.scoreText = this.add.text(
        this.game.width / 2, 30, '' + 0,
        { font: '20px monospace', fill: '#fff', align: 'center' }
      );
      this.scoreText.anchor.setTo(0.5, 0.5);
    },
    setupPlayerIcons: function () {
      this.lives = this.add.group();
      // calculate location of first life icon
      var firstLifeIconX = this.game.width - 10 - (config.PLAYER_EXTRA_LIVES * 30);
      for (var i = 0; i < config.PLAYER_EXTRA_LIVES; i++) {
        var life = this.lives.create(firstLifeIconX + (30 * i), 30, 'player');
        life.scale.setTo(0.5, 0.5);
        life.anchor.setTo(0.5, 0.5);
      }
    },

    updateplayers:function (){
      var _this=this;
      var createPlayer=function(p){
        var plane = _this.add.sprite(p.x, p.y, 'player');
        plane.id=p.id
        plane.anchor.setTo(0.5, 0.5);
        plane.animations.add('fly', [0,1,2], 20, true);
        plane.play('fly');
        _this.physics.enable(plane, Phaser.Physics.ARCADE);
        plane.body.collideWorldBounds = true; //El jugador no puede salirse de los bordes de la pantalla
        plane.body.setSize(20, 20, 0, -5);
        plane.bullets=[];
        return plane;
      }
      var createFriendlyPlayer=function(p){
        var plane = _this.add.sprite(p.x, p.y, 'player');
        plane.id=p.id
        plane.anchor.setTo(0.5, 0.5);
        plane.animations.add('fly', [3], 20, true);
        plane.play('fly');
        _this.physics.enable(plane, Phaser.Physics.ARCADE);
        plane.body.collideWorldBounds = true; //El jugador no puede salirse de los bordes de la pantalla
        plane.body.setSize(20, 20, 0, -5);
        plane.bullets=[];
        return plane;
      }
      var createBullet=function(b){
        var bullet = _this.add.sprite(b.x,b.y,'bullet');
        bullet.id=b.id
        bullet.anchor.setTo(0.5, 0.5);
        _this.physics.enable(bullet, Phaser.Physics.ARCADE);
        bullet.body.collideWorldBounds = false;
        bullet.body.setSize(5, 5, 0, -5);
        return bullet;
      }
      var movePlayer=function(p,ps){
        p.x=ps.x;
        p.y=ps.y;
      }
      var moveBullet=function(b,bs){
        b.x=bs.x;
        b.y=bs.y;
      }

      // Creamos nuevos jugadores o los movemos.
      var i,ii,iof,iofb;
      for (i=0;i<levelparams.players.length;i++){
        iof=this.players.map(p=>p.id).indexOf(levelparams.players[i].id)

        // Creamos o movemos a los jugadores.
        if(iof==-1){
          if(levelparams.players[i].id==gamesocket.token)
            this.players.push(createPlayer(levelparams.players[i]));
          else
            this.players.push(createFriendlyPlayer(levelparams.players[i]));
          continue;
        }else
          movePlayer(this.players[iof],levelparams.players[i]);

        // Creamos o movemos los disparos.
        for (ii=0;ii<levelparams.players[i].bullets.length;ii++){
          iofb=this.players[iof].bullets.map(p=>p.id).indexOf(levelparams.players[i].bullets[ii].id);
          if(iofb==-1)
            this.players[iof].bullets.push(createBullet(levelparams.players[i].bullets[ii]));
          else
            moveBullet(this.players[iof].bullets[iofb],levelparams.players[i].bullets[ii]);
        }

        // Eliminamos los dispados fuera del juego.
        for (ii=0;ii<this.players[iof].bullets.length;ii++){
          iofb=levelparams.players[i].bullets.map(p=>p.id).indexOf(this.players[iof].bullets[ii].id)
          if (iofb==-1){
            var indx = this.players[iof].bullets.map(p=>p.id).indexOf(this.players[iof].bullets[ii].id)
            this.players[iof].bullets[indx].destroy();
            this.players[iof].bullets.splice(indx,1);
          }
        }
      }

      // Jugadores desconectados.
      for (i=0;i<this.players.length;i++){
        iof=levelparams.players.map(p=>p.id).indexOf(this.players[i].id)
        if (iof==-1){
          var indx =this.players.map(p=>p.id).indexOf(this.players[i].id)
          this.players[indx].destroy();
          this.players.splice(indx,1);
        }
      }

    },
    updateenemys:function(){
      var _this=this;
      var createenemy=function(p){
        var plane = _this.add.sprite(p.x, p.y, 'greenEnemy');
        plane.id=p.id
        plane.anchor.setTo(0.5, 0.5);
        plane.animations.add('fly', [0,1,2], 20, true);
        plane.play('fly');
        _this.physics.enable(plane, Phaser.Physics.ARCADE);
        plane.body.collideWorldBounds = false; //El jugador no puede salirse de los bordes de la pantalla
        plane.body.setSize(20, 20, 0, -5);
        plane.bullets=[];
        return plane;
      }
      var moveenemy=function(p,ps){
        p.x=ps.x;
        p.y=ps.y;
      }
      for (var i=0;i<levelparams.enemys.length;i++){
        iof=this.enemys.map(p=>p.id).indexOf(levelparams.enemys[i].id)

        // Creamos o movemos a los enemigos.
        if(iof==-1){
          this.enemys.push(createenemy(levelparams.enemys[i]));
          continue;
        }else
          moveenemy(this.enemys[iof],levelparams.enemys[i]);
      }
      // Eliminamos los enemigos fuera del juego.
      for (var e in this.enemys){
        var iofb=levelparams.enemys.map(p=>p.id).indexOf(this.enemys[e].id)
        if (iofb==-1) {
          var indx=this.enemys.map(p=>p.id).indexOf(this.enemys[e].id)
          this.enemys[indx].destroy();
          this.enemys.splice(indx,1);
        }
      }

    },
    updatelogs:function(){
      //this.logs.text = JSON.stringify(levelparams.players, null, "\t");
    },
    updateexplosions:function(){
      for (var e in levelparams.explosions){
        if (this.explosionPool.countDead() === 0) {
          return;
        }
        var explosion = this.explosionPool.getFirstExists(false);
        explosion.reset(levelparams.explosions[e].x, levelparams.explosions[e].y);
        explosion.play('boom', 15, false, true);
        // add the original sprite's velocity to the explosion
        //explosion.body.x = levelparams.explosions[i].x;
        //explosion.body.y = levelparams.explosions[i].y;
      };
    },
    updateScore:function(){
      let iof=levelparams.players.map(p=>p.id).indexOf(gamesocket.token);
      if(iof!=-1)
        this.scoreText.text = levelparams.players[iof].score;
    },
    processPlayerInput: function () {

      if (this.joystick.keyleft.isDown) gamesocket.socket.emit('client.move.left',gamesocket.token)
      else if (this.joystick.keyright.isDown)gamesocket.socket.emit('client.move.right',gamesocket.token)
      if (this.joystick.keyup.isDown)   gamesocket.socket.emit('client.move.up',gamesocket.token)
      else if (this.joystick.keydown.isDown) gamesocket.socket.emit('client.move.down',gamesocket.token)

    },



    quitGame: function (pointer) {
      // Here you should destroy anything you no longer need.
      // Stop music, delete sprites, purge caches, free resources, all that good stuff.
      this.sea.destroy();
      //this.players[].destroy();
      //this.enemyPool.destroy();
      //this.bulletPool.destroy();
      //this.explosionPool.destroy();
      //this.instructions.destroy();
      //this.scoreText.destroy();
      ///this.endText.destroy();
      //this.returnText.destroy();
      // Then let's go back to the main menu.
      //this.state.start('MainMenu');
    },


    setupEnemies: function () {
      this.enemyPool = this.add.group();
      this.enemyPool.enableBody = true;
      this.enemyPool.physicsBodyType = Phaser.Physics.ARCADE;
      this.enemyPool.createMultiple(50, 'greenEnemy');
      this.enemyPool.setAll('anchor.x', 0.5);
      this.enemyPool.setAll('anchor.y', 0.5);
      this.enemyPool.setAll('outOfBoundsKill', true);
      this.enemyPool.setAll('checkWorldBounds', true);
      this.enemyPool.setAll('reward', 10, false, false, 0, true);

      // Set the animation for each sprite
      this.enemyPool.forEach(function (enemy) {
        enemy.animations.add('fly', [ 0, 1, 2 ], 20, true);
        enemy.animations.add('hit', [ 3, 1, 3, 2 ], 20, false);
        enemy.events.onAnimationComplete.add( function (e) {
          e.play('fly');
        }, this);
      });

      this.nextEnemyAt = 0;
      this.enemyDelay = config.SPAWN_ENEMY_DELAY;

      this.shooterPool = this.add.group();
      this.shooterPool.enableBody = true;
      this.shooterPool.physicsBodyType = Phaser.Physics.ARCADE;
      this.shooterPool.createMultiple(20, 'whiteEnemy');
      this.shooterPool.setAll('anchor.x', 0.5);
      this.shooterPool.setAll('anchor.y', 0.5);
      this.shooterPool.setAll('outOfBoundsKill', true);
      this.shooterPool.setAll('checkWorldBounds', true);
      this.shooterPool.setAll('reward', config.SHOOTER_REWARD, false, false, 0, true);

      // Set the animation for each sprite
      this.shooterPool.forEach(function (enemy) {
        enemy.animations.add('fly', [ 0, 1, 2 ], 20, true);
        enemy.animations.add('hit', [ 3, 1, 3, 2 ], 20, false);
        enemy.events.onAnimationComplete.add( function (e) {
          e.play('fly');
        }, this);
      });
      // start spawning 5 seconds into the game
      this.nextShooterAt = this.time.now + Phaser.Timer.SECOND * 5;
      this.shooterDelay = config.SPAWN_SHOOTER_DELAY;

    },
    setupBullets: function () {
      // Add an empty sprite group into our game
      this.bulletPool = this.add.group();

      // Enable physics to the whole sprite group
      this.bulletPool.enableBody = true;
      this.bulletPool.physicsBodyType = Phaser.Physics.ARCADE;

      // Add 100 'bullet' sprites in the group.
      // By default this uses the first frame of the sprite sheet and

      // sets the initial state as non-existing (i.e. killed/dead)
      this.bulletPool.createMultiple(100, 'bullet');

      // Sets anchors of all sprites
      this.bulletPool.setAll('anchor.x', 0.5);
      this.bulletPool.setAll('anchor.y', 0.5);

      // Automatically kill the bullet sprites when they go out of bounds
      this.bulletPool.setAll('outOfBoundsKill', true);
      this.bulletPool.setAll('checkWorldBounds', true);

      this.nextShotAt = 0;
      this.shotDelay = config.SHOT_DELAY;
    },

    setupText: function () {
      this.instructions = this.add.text( this.game.width / 2, this.game.height - 100,
       'Use Arrow Keys to Move, Press Z to Fire\n' + 'Tapping/clicking does both',
       { font: '20px monospace', fill: '#fff', align: 'center' }
      );
      this.instructions.anchor.setTo(0.5, 0.5);
      this.instExpire = this.time.now + config.INSTRUCTION_EXPIRE;
      this.score = 0;
      this.scoreText = this.add.text(
        this.game.width / 2, 30, '' + this.score,
        { font: '20px monospace', fill: '#fff', align: 'center' }
      );
      this.scoreText.anchor.setTo(0.5, 0.5);
    },


    checkCollisions: function () {
      this.physics.arcade.overlap(
        this.bulletPool, this.enemyPool, this.enemyHit, null, this
      );

      this.physics.arcade.overlap(
        this.player, this.enemyPool, this.playerHit, null, this
      );
    },
    spawnEnemies: function () {
      if (this.nextEnemyAt < this.time.now && this.enemyPool.countDead() > 0) {
        this.nextEnemyAt = this.time.now + this.enemyDelay;
        var enemy = this.enemyPool.getFirstExists(false);
        // spawn at a random location top of the screen
        enemy.reset(this.rnd.integerInRange(20, this.game.width - 20), 0);
        // also randomize the speed
        enemy.body.velocity.y = this.rnd.integerInRange(
          config.ENEMY_MIN_Y_VELOCITY, config.ENEMY_MAX_Y_VELOCITY
        );
        enemy.play('fly');
      }
    },

    processDelayedEffects: function () {
      if (this.instructions.exists && this.time.now > this.instExpire) {
        this.instructions.destroy();
      }
      if (this.ghostUntil && this.ghostUntil < this.time.now) {
        this.ghostUntil = null;
        this.player.play('fly');
      }
      if (this.showReturn && this.time.now > this.showReturn) {
        this.returnText = this.add.text(
          this.game.width / 2, this.game.height / 2 + 20,
          'Press Z or Tap Game to go back to Main Menu',
          { font: '16px sans-serif', fill: '#fff'}
        );
        this.returnText.anchor.setTo(0.5, 0.5);
        this.showReturn = false;
      }
    },

    enemyHit: function (bullet, enemy) {
      bullet.kill();
      this.damageEnemy(enemy, config.BULLET_DAMAGE);
    },
    explode: function (sprite) {
      if (this.explosionPool.countDead() === 0) {
        return;
      }
      var explosion = this.explosionPool.getFirstExists(false);
      explosion.reset(sprite.x, sprite.y);
      explosion.play('boom', 15, false, true);
      // add the original sprite's velocity to the explosion
      explosion.body.velocity.x = sprite.body.velocity.x;
      explosion.body.velocity.y = sprite.body.velocity.y;
    },

    fire: function() {
      if (this.nextShotAt > this.time.now) {
        return;
      }
      this.nextShotAt = this.time.now + this.shotDelay;

      // Find the first dead bullet in the pool
      var bullet = this.bulletPool.getFirstExists(false);
      // Reset (revive) the sprite and place it in a new location
      bullet.reset(this.player.x, this.player.y - 20);
      bullet.body.velocity.y = -500;
    },
    enemyFire: function() {
      this.shooterPool.forEachAlive(function (enemy) {
        if (this.time.now > enemy.nextShotAt && this.enemyBulletPool.countDead() > 0) {
          var bullet = this.enemyBulletPool.getFirstExists(false);
          bullet.reset(enemy.x, enemy.y);
          this.physics.arcade.moveToObject(
            bullet, this.player, config.ENEMY_BULLET_VELOCITY
          );
          enemy.nextShotAt = this.time.now + config.SHOOTER_SHOT_DELAY;
        }
      }, this);
    },

    playerHit: function (player, enemy) {
      // check first if this.ghostUntil is not not undefined or null
      if (this.ghostUntil && this.ghostUntil > this.time.now) {
        return;
      }
      // crashing into an enemy only deals 5 damage
      this.damageEnemy(enemy, config.CRASH_DAMAGE);
      var life = this.lives.getFirstAlive();
      if (life !== null) {
        life.kill();
        this.ghostUntil = this.time.now + config.PLAYER_GHOST_TIME;
        this.player.play('ghost');
      } else {
        this.explode(player);
        player.kill();
        this.displayEnd(false);
      }
    },
    damageEnemy: function (enemy, damage) {
      enemy.damage(damage);
      if (enemy.alive) {
        enemy.play('hit');
      } else {
        this.explode(enemy);
        this.addToScore(enemy.reward);
      }
    },
    spawnEnemies: function () {
      if (this.nextEnemyAt < this.time.now && this.enemyPool.countDead() > 0) {
        this.nextEnemyAt = this.time.now + this.enemyDelay;
        var enemy = this.enemyPool.getFirstExists(false);
        // spawn at a random location top of the screen
        enemy.reset(
          this.rnd.integerInRange(20, this.game.width - 20), 0,
          config.ENEMY_HEALTH
        );
        enemy.body.velocity.y = this.rnd.integerInRange(
          config.ENEMY_MIN_Y_VELOCITY, config.ENEMY_MAX_Y_VELOCITY
        );
        enemy.play('fly');
      }
    },
    addToScore: function (score) {
      this.score += score;
      this.scoreText.text = this.score;
      if (this.score >= 2000) {
        this.enemyPool.destroy();
        this.displayEnd(true);
      }
    },
    displayEnd: function (win) {
      // you can't win and lose at the same time
      if (this.endText && this.endText.exists) {
        return;
      }

      var msg = win ? 'You Win!!!' : 'Game Over!';
      this.endText = this.add.text(
        this.game.width / 2, this.game.height / 2 - 60, msg,
        { font: '72px serif', fill: '#fff' }
      );
      this.endText.anchor.setTo(0.5, 0);

      this.showReturn = this.time.now + config.RETURN_MESSAGE_DELAY;
    },
  };

});
