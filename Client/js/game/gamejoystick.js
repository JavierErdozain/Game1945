define ('gamejoystick',['Phaser','game'],
  function(p,game){
    return {
      keyup : game.input.keyboard.addKey(Phaser.Keyboard.UP),
      keydown : game.input.keyboard.addKey(Phaser.Keyboard.DOWN),
      keyleft : game.input.keyboard.addKey(Phaser.Keyboard.LEFT),
      keyright : game.input.keyboard.addKey(Phaser.Keyboard.RIGHT),
      keyfire : game.input.keyboard.addKey(Phaser.Keyboard.Z)
    }
});
