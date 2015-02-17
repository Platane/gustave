var Abstract = require('abstract')
  , io = require('socket.io-client')

var init = function( config ){
    Abstract.init.call( this )

    var uri = 'http://'+config.host+':'+config.port+'/jsonrpc'

    this.socket = io( uri )

    this.socket
    .on('VideoLibrary.OnUpdate', relayEvent.bind( this, 'VideoLibrary.OnUpdate') )
    .on('VideoLibrary.OnScanFinished', function(){
        this.status.scanning = false
        this.dispatch( 'scan-end' )
    }.bind( this ) )
    .on('VideoLibrary.OnScanStarted', function(){
        this.status.scanning = true
        this.dispatch( 'scan-start' )
    }.bind( this ) )

    return this
}

var scan = function(){
    this.socket.emit( 'VideoLibrary.Scan' )
}
var relayEvent = function( eventName, data ){
    this.dispatch( eventName , data )
}


module.exports = Object.create( Abstract )
.extend({
    init: init,
    scan: scan
})
