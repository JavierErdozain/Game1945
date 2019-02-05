'use strict';

requirejs.config({
    baseUrl: 'static/js',
    paths: {
        Phaser: 'lib/phaser-arcade-physics.min',
        jquery: 'lib/jquery-3.3.1.min',
        socket: 'lib/socket.io',

        game:                 'game/game',
        gameconfig:           'game/gameconfig',
        gameboot :            'game/gameboot',
        gamepreloader:        'game/gamepreloader',
        gamemenu:             'game/gamemenu',
        gamelogic:            'game/gamelogic',
        gamesocket:           'game/gamesocket',
        gamelevelparameters:  'game/gamelevelparameters'
    },
});

require([
    'require', 'jquery', 'game', 'gameconfig', 'gameboot',
    'gamepreloader', 'gamemenu', 'gamelogic' ,'gamesocket'
  ], function(require, $, game, gameconfig, gameboot,
              preloader, menu, gamelogic,gamesocket) {

    $.post('/auth').done(function(data) {

      gamesocket.token=data.token;
      game.state.add('Boot', gameboot);
      game.state.add('Preloader', preloader);
      game.state.add('MainMenu', menu);
      game.state.add('Game', gamelogic);

      game.state.start('Boot');
    });
});
