'use strict';
// Definición de objetos del juego.
var gameobjects = function(){

  var gameconfig = require('./gameconfig');

  // Jugador.
  this.player=function (id, x, y){
    this.x = x
    this.y = y
    this.angle = 0
    this.id=id
    this.speed = gameconfig.PLAYER_SPEED;
    this.firetype = 1;
    this.bullets=[];
    this.height=20;
    this.width=20;
    this.isdead=false;
    this.score=0;
  };

  // Proyectiles.
  this.bullet = function(id,x, y){
    this.id=id
    this.speed =gameconfig.FIRE_BASIC_VELOCITY;
    this.x=x;
    this.y=y;
    this.height=5;
    this.width=5;
  };

  // Enemy.
  this.enemy=function (id, x, y, pnts){
    this.x = x
    this.y = y
    this.angle = 0
    this.id=id
    this.speed = gameconfig.ENEMY_SPEED;
    this.firetype = 1;
    this.bullets=[];
    this.height=20;
    this.width=20;
    this.points=pnts;
  };

  this.explosion=function(x,y){
    this.x = x
    this.y = y
  }
}

module.exports = new gameobjects()
