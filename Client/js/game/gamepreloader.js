define('gamepreloader',['game'], function (game){

  return {

    background : null,
    preloadBar : null,

    preload: function () {

      //  Show the loading progress bar asset we loaded in boot.js
      this.stage.backgroundColor = '#2d2d2d';

      this.preloadBar = this.add.sprite(this.game.width / 2 - 100, this.game.height / 2, 'preloaderBar');
      this.add.text(this.game.width / 2, this.game.height / 2 - 30, "Loading...", { font: "32px monospace", fill: "#fff" }).anchor.setTo(0.5, 0.5);

      //  This sets the preloadBar sprite as a loader sprite.
      //  What that does is automatically crop the sprite from 0 to full-width
      //  as the files below are loaded in.
      this.load.setPreloadSprite(this.preloadBar);

      //  Here we load the rest of the assets our game needs.
      this.load.image('titlepage', 'static/assets/titlepage.png');
      this.load.image('sea', 'static/assets/sea.png');
      this.load.image('bullet', 'static/assets/bullet.png');
      this.load.image('enemyBullet', 'static/assets/enemy-bullet.png');
      this.load.image('powerup1', 'static/assets/powerup1.png');
      this.load.spritesheet('greenEnemy', 'static/assets/enemy.png', 32, 32);
      this.load.spritesheet('whiteEnemy', 'static/assets/shooting-enemy.png', 32, 32);
      this.load.spritesheet('boss', 'static/assets/boss.png', 93, 75);
      this.load.spritesheet('explosion', 'static/assets/explosion.png', 32, 32);
      this.load.spritesheet('player', 'static/assets/player.png', 64, 64);
      this.load.audio('explosion', ['static/assets/explosion.ogg', 'static/assets/explosion.wav']);
      this.load.audio('playerExplosion', ['static/assets/player-explosion.ogg', 'static/assets/player-explosion.wav']);
      this.load.audio('enemyFire', ['static/assets/enemy-fire.ogg', 'static/assets/enemy-fire.wav']);
      this.load.audio('playerFire', ['static/assets/player-fire.ogg', 'static/assets/player-fire.wav']);
      this.load.audio('powerUp', ['static/assets/powerup.ogg', 'static/assets/powerup.wav']);
      //this.load.audio('titleMusic', ['audio/main_menu.mp3']);
      //  + lots of other required assets here

    },

    create: function () {

      //  Once the load has finished we disable the crop because we're going to sit in the update loop for a short while as the music decodes
      this.preloadBar.cropEnabled = false;

    },

    update: function () {

      //  You don't actually need to do this, but I find it gives a much smoother game experience.
      //  Basically it will wait for our audio file to be decoded before proceeding to the MainMenu.
      //  You can jump right into the menu if you want and still play the music, but you'll have a few
      //  seconds of delay while the mp3 decodes - so if you need your music to be in-sync with your menu
      //  it's best to wait for it to decode here first, then carry on.

      //  If you don't have any music in your game then put the game.state.start line into the create function and delete
      //  the update function completely.

      //if (this.cache.isSoundDecoded('titleMusic') && this.ready == false)
      //{
      //  this.ready = true;
        this.state.start('MainMenu');
      //}

    }
  }

});
