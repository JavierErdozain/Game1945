'use strict';
var game = function(){
  var gameobjects= require('./gameobjects');    // Definición de objetos del juego.
  var gameconfig= require('./gameconfig');      // Valores de configuración del juego.

  var socketcontroller;                         // Comunicador con los clientes.
  var tickLengthMs = 1000 / 20                  // Fecuencia con la que envia datos a los clientes.
  var previousTick = Date.now()


  //var actualTicks = 0
  //var gameend = Date.now() + 10000;

  var gameLoop = function () {
    var updateBullets = function(){
      var i,ib;
      for (i=0;i<players.length;i++){
        for (ib=0;ib<players[i].bullets.length;ib++){
          players[i].bullets[ib].y-=4;
          if (players[i].bullets[ib].y<=3)
            players[i].bullets.splice(players[i].bullets.map(e=>e.id).indexOf(players[i].bullets[ib].id),1);
        }
      }
    }
    var now = Date.now()
    //if (now>gameend) {console.log('fin partida: '); return;};


    if (previousTick + tickLengthMs <= now) {
      var delta = (now - previousTick) / 1000
      previousTick = now
      updateBullets();
      //calculateCollisions();

      socketcontroller.emit('playerspositions', JSON.stringify(players))

    }

    if (Date.now() - previousTick < tickLengthMs - 16)
      setTimeout(gameLoop)
    else
      setImmediate(gameLoop)


  }

  var players=[];
  this.addnewplayer=function (id){
    players.push(new gameobjects.player(id,400,300))
  };
  this.clientemoveright = function (id){
    var i = players.map(e=>e.id).indexOf(id)
    if (i==-1)return;
    players[i].x += players[i].speed;
  };
  this.clientemoveleft = function (id){
    var i = players.map(e=>e.id).indexOf(id)
    if (i==-1)return;
    players[i].x -= players[i].speed;
  };
  this.clientemoveup = function (id){
    var i = players.map(e=>e.id).indexOf(id)
    if (i==-1)return;
    players[i].y -= players[i].speed;
  };
  this.clientemovedown = function (id){
    var i = players.map(e=>e.id).indexOf(id)
    if (i==-1)return;
    players[i].y += players[i].speed;
  };
  this.clientfire = function(id){
    var i = players.map(e=>e.id).indexOf(id)
    if (i==-1)return;
    if (players[i].bullets.length<gameconfig.BULLETNUMERS){
      var bulletid =players[i].bullets.length;
      if(bulletid==10) bulletid=0;
      players[i].bullets.push(
            new gameobjects.bullet(
              bulletid,players[i].x,
              players[i].y-(gameconfig.PLAYER_HEIGHT)));
      bulletid+=1;
    }

  };
  this.clientdisconnect=function(){
    players.splice(players.map(e=>e.id).indexOf(this.id),1);
  };
  this.run=function (socket){
    socketcontroller=socket;
    gameLoop();
  };
}

module.exports = new game();
