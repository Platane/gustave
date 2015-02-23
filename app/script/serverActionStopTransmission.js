var Abstract = require('../util/abstract')
  , wait = require('../util/waitEvent')
  , trueOrWait = require('../util/trueOrWait')
  , input = require('../util/inputEvent')

var init = function( mods ){
    this.mods = mods
    this._chains = []
    return this
}

var enable = function( ){

    this.disable()

    var transmission = this.mods.transmission
    var server = this.mods.server
    var timer = this.mods.timer

    this._chains.push(
        input( server, 'ask-transmission-stop' )
        .then( timer.pause.bind( timer ) )
    )

    this._chains.push(
        input( timer, 'pause' )
        .then( transmission.pauseAll.bind( transmission ) )
    )

    this._chains.push(
        input( timer, 'unpause' )
        .then( transmission.startAll.bind( transmission ) )
    )

}
var disable = function( ){
    while( this._chains.length )
        this._chains.shift().kill()
}

module.exports = Object.create( Abstract )
.extend({
    init: init,
    enable: enable,
    disable: disable,
})
