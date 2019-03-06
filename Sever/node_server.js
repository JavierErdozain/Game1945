'use strict';

var server = require('./expresserver')
    , socketIo = require('socket.io')
    , jwt = require('socketio-jwt')
    , config = require('./expresserver_config.json')
    , game = require('./game/game')
    , gameobjects = require('./game/gameobjects')
    , io;
;
server = server.listen(process.env.PORT || config.port);

console.log('Game server started on port %d', server.address().port);

// initialize socket, a namespace and authorize the connection
io = socketIo.listen(server).of('/game1945');
io.use(jwt.authorize({secret: config.secret, handshake: true}));

io.on('connection', function(socket) {
  game.addnewplayer(socket.id);
  socket.on('disconnect',game.clientdisconnect)
  socket.on('client.move.right', game.clientemoveright)
  socket.on('client.move.left', game.clientemoveleft)
  socket.on('client.move.up', game.clientemoveup)
  socket.on('client.move.down', game.clientemovedown)
  socket.on('client.fire', game.clientfire)
  console.log('Client has connected to the server!' + socket.id);
});

game.run(io);
