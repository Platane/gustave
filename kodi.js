var Promise = require('promise')
  , io = require('socket.io-client')
  , eventEmitter = require('events').EventEmitter


var init = function( config ){

    eventEmitter.call( this )
    for( var i in eventEmitter )
      this[ i ] = eventEmitter[ i ]

    var uri = 'http://'+config.host+':'+config.port+'/jsonrpc'

    this.socket = io( uri )


    this.socket
    .on('VideoLibrary.OnUpdate', relayEvent.bind( this, 'VideoLibrary.OnUpdate') )

    return this
}

var scan = function(){
    this.socket.emit( 'VideoLibrary.Scan' )
}
var relayEvent = function( eventName, data ){
    this.dispatch( eventName , data )
}



module.exports = {
    init: init,
    scan: scan
}
