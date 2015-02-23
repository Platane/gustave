var Abstract = require('./abstract')
  , io = require('socket.io-client')


var init = function( config ){
    Abstract.init.call( this )
    this.status = {
        scanning : false
    }

    var uri = 'http://'+config.host+':'+config.port+'/jsonrpc'

    this.socket = io( uri )

    this.socket
    .on('VideoLibrary.OnUpdate', relayEvent.bind( this, 'update-entry') )
    .on('VideoLibrary.OnScanFinished', function(){
        this.status.scanning = false
        this.emit( 'scan-end' )
    }.bind( this ) )
    .on('VideoLibrary.OnScanStarted', function(){
        this.status.scanning = true
        this.emit( 'scan-start' )
    }.bind( this ) )

    return this
}

var scan = function(){
    console.log('scan kodi')
    this.socket.emit( 'VideoLibrary.Scan' )
}
var relayEvent = function( eventName, data ){
    console.log( data )
    this.emit( eventName , data )
}


module.exports = Object.create( Abstract )
.extend({
    init: init,
    scan: scan
})
