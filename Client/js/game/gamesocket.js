define('gamesocket',['socket'
], function (io) {
      return{
        socket:{},
        token:'',
        connect:function (){
          this.socket = io.connect('/game1945', {query: 'token=' + this.token});
        }
      }

});
