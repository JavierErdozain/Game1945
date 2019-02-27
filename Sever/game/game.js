'use strict';
var game = function(){
  var gameobjects= require('./gameobjects');    // Definición de objetos del juego.
  var gameconfig= require('./gameconfig');      // Valores de configuración del juego.
  var shortid = require('shortid');             // Generador de ids únicos.
  var fs = require('fs');                       // Lector de ficheros.

  var roomgame = {
    "players":[],     // Jugadores de la partida.
    "enemys":[],      // Enemigos de la partida.
    "explosions":[],  // Explosiones.
    "time":0          // Tiempo de juego.
  };

  var socketcontroller;                         // Comunicador con los clientes.
  var tickLengthMs = 1000 / 20                  // Fecuencia con la que envia datos a los clientes.
  var previousTick = Date.now()

  var loadlevelinstructions=function(){
    var levelconfig = JSON.parse(fs.readFileSync('game/levels/level01.json', 'utf8'));
    levelconfig.sort((a,b) => (a.millisecond > b.millisecond) ? 1 : ((b.millisecond > a.millisecond) ? -1 : 0));
    var addenemyplane = function(act){
      roomgame.enemys.push(new gameobjects.enemy(act.id,act.x,act.y));
    }
    for(var l=0;l<100;l++){
      for (var i=0;i<levelconfig.length;i++)
        setTimeout(addenemyplane,levelconfig[i].millisecond + (l * 8000) ,levelconfig[i]);
    }

  };
  var gameLoop = function () {
    var updateBullets = function(){
      var i,ib;
      for (i=0;i<roomgame.players.length;i++){
        for (ib=0;ib<roomgame.players[i].bullets.length;ib++){
          roomgame.players[i].bullets[ib].y-=gameconfig.FIRE_BASIC_VELOCITY;
          if (roomgame.players[i].bullets[ib].y<=3)
            roomgame.players[i].bullets.splice(roomgame.players[i].bullets.map(e=>e.id).indexOf(roomgame.players[i].bullets[ib].id),1);
        }
      }
    };
    var updateEnemys = function(){
      for (var i=0;i<roomgame.enemys.length;i++){
        roomgame.enemys[i].y+=4;
        if (roomgame.enemys[i].y>=600)
          roomgame.enemys.splice(roomgame.enemys.map(e=>e.id).indexOf(roomgame.enemys[i].id),1);
      }
    };
    var calculateCollisions = function(){
      var isCollide = function(a, b) {
        return !(
            ((a.y + a.height) < (b.y)) ||
            (a.y > (b.y + b.height)) ||
            ((a.x + a.width) < b.x) ||
            (a.x > (b.x + b.width))
        );
      };

      roomgame.explosions=[];

      // Colisiones de cada avion.
      for (var p in roomgame.players){

        // Colisiones proyectiles del jugador.
        for(var b in roomgame.players[p].bullets)
          for (var e in roomgame.enemys)
            if (isCollide(roomgame.players[p].bullets[b],roomgame.enemys[e])){
              roomgame.explosions.push(new gameobjects.explosion(roomgame.enemys[e].x, roomgame.enemys[e].y));
              roomgame.enemys.splice(roomgame.enemys.map(e=>e.id).indexOf(roomgame.enemys[e].id),1);
              roomgame.players[p].bullets.splice(roomgame.players[p].bullets.map(e=>e.id).indexOf(roomgame.players[p].bullets[b].id),1);
              break;
            }

        // Colisiones del propio jugador con otros jugadores.
        for (var e in roomgame.enemys)
          if (isCollide(roomgame.players[p],roomgame.enemys[e])){
            roomgame.explosions.push(new gameobjects.explosion(roomgame.players[p].x, roomgame.players[p].y));
            roomgame.explosions.push(new gameobjects.explosion(roomgame.enemys[e].x, roomgame.enemys[e].y));
            roomgame.enemys.splice(roomgame.enemys.map(e=>e.id).indexOf(roomgame.enemys[e].id),1);
            roomgame.players.splice(roomgame.players.map(e=>e.id).indexOf(roomgame.players[p].id),1);
            break;
          }

        // Colisiones proyectiles enemigos contra aviones jugadores.

      }

    };
    var now = Date.now()

    if (previousTick + tickLengthMs <= now) {
      previousTick = now
      updateBullets();
      updateEnemys();
      calculateCollisions();

      socketcontroller.emit('playerspositions', JSON.stringify(roomgame));
    }

    if (Date.now() - previousTick < tickLengthMs - 16) setTimeout(gameLoop)
    else setImmediate(gameLoop)
  }

  this.addnewplayer=function (id){
    roomgame.players.push(new gameobjects.player(id,400,300))
  };
  this.clientemoveright = function (id){
    var i = roomgame.players.map(e=>e.id).indexOf(id)
    if (i==-1)return;
    roomgame.players[i].x += roomgame.players[i].speed;
  };
  this.clientemoveleft = function (id){
    var i = roomgame.players.map(e=>e.id).indexOf(id)
    if (i==-1)return;
    roomgame.players[i].x -= roomgame.players[i].speed;
  };
  this.clientemoveup = function (id){
    var i = roomgame.players.map(e=>e.id).indexOf(id)
    if (i==-1)return;
    roomgame.players[i].y -= roomgame.players[i].speed;
  };
  this.clientemovedown = function (id){
    var i = roomgame.players.map(e=>e.id).indexOf(id)
    if (i==-1)return;
    roomgame.players[i].y += roomgame.players[i].speed;
  };
  this.clientfire = function(id){
    var i = roomgame.players.map(e=>e.id).indexOf(id)
    if (i==-1)return;
    if (roomgame.players[i].bullets.length<=gameconfig.BULLETNUMERS){
      var bulletid =shortid.generate();
      roomgame.players[i].bullets.push(
            new gameobjects.bullet(
              bulletid,roomgame.players[i].x,
              roomgame.players[i].y-(gameconfig.PLAYER_HEIGHT)));
    }

  };
  this.clientdisconnect=function(){
    roomgame.players.splice(roomgame.players.map(e=>e.id).indexOf(this.id),1);
  };
  this.run=function (socket){
    socketcontroller=socket;
    loadlevelinstructions();
    gameLoop();
  };
}

module.exports = new game();
