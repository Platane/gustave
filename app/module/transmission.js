var xml2js = require('xml2js').parseString
  , request = require('request')
  , Promise = require('promise')
  , Abstract = require('./abstract')



var trReq = function( req, retry ){
    var that = this
    var uri = 'http://'+this.config.host+':'+this.config.port+'/transmission/rpc/'
    var token = this._transmissionToken||''
    var user = this.config.user
    var pass = this.config.pass

    if( retry > 5 )
        return Promise.reject('max retry')

    return new Promise(function(resolve, reject){
        request({
            method: 'POST',
            uri: uri,
            json: true,
            body: req,
            headers: {
                'x-transmission-session-id': token
            },
            timeout : 20000,
            'auth': {
                'user': user,
                'pass': pass,
                'sendImmediately': true
            }
        },
        function(err, response, body){
            if( err )
                return reject( err )

            if( response.statusCode == 409 ){
                that._transmissionToken = response.headers['x-transmission-session-id'] || response.headers['X-Transmission-Session-Id']
                return void trReq.call( that, req, (0|retry)+1 ).then( resolve, reject )
            }
            if( response.statusCode == 200 )
                return resolve( body )

            return reject( response )
        })

    })
}


var torrentMatch = function( t1, t2 ){
    return t1.name == t2.name
}
var mergeTorrents = function( a, b ){

    var has_been_peered = new Array(a.length)

    var updated = [],
        removed = [],
        added = []

    for( var i=b.length;i--;){
        for( var j=a.length;j--;)
            if( torrentMatch( b[i], a[j] ) ) {
                has_been_peered[j] = true

            if( a[j].status != b[i].status ) {
                a[j].status = b[i].status
                updated.push( a )
            }
            break
        }
        if( j<0 ) {
            added.push( b[i] )
            a.push( b[i] )
        }
    }

    for( var i=has_been_peered.length;i--;)
        if(!has_been_peered[i])
            removed.push( a.splice(i,1)[0] )

    // TODO dispatch events

    return {
        updated: updated,
        removed: removed,
        added: added,
    }
}


var init = function( config ){

    Abstract.init.call( this )

    this.torrents = []
    this.config = config

    this.status = {
        global_up:0,  // B/s
        global_down:0,
        paused: false
    }

    return this
}
var updateTorrentList = function(){
    var that = this
    return trReq.call(this,{
        "arguments": {
            "fields": [
            "id",
            "name",
            "status"
            ]
        },
        "method": "torrent-get"
    })
    .then(function( res ){
        return mergeTorrents( that.torrents, res.arguments.torrents )
    })
}
var updateStatus = function(){
    var that = this
    return trReq.call(this,{
        "arguments": {
            "fields": [
            "rateDownload",
            "rateUpload"
            ]
        },
        "method": "torrent-get"
    })
    .then(function( res ){
        var r= res.arguments.torrents.reduce(function(prev, c){
            prev.up += c.rateDownload
            prev.down += c.rateUpload
            return prev
        },{up: 0, down: 0})

        that.status.global_down = r.down
        that.status.global_up = r.up

        return that.status
    })
}
var hasTorrent = function( torrent ){
    if( typeof torrent == 'string' )
        torrent = {name: torrent}
    for( var i=this.torrents.length;i-- && !torrentMatch(torrent, this.torrents[i]););
    return i>=0
}
var addTorrent = function( torrent ){
    return trReq.call(this,{
        "method": "torrent-add",
        "arguments" : {
            "filename": torrent.link
        }
    })
}
var pauseAll = function(){
    var that = this
    return trReq.call(this,{
        "method": "torrent-stop"
    })
    .then(function(){
        that.status.paused = true
    })
}
var startAll = function(){
    var that = this
    return trReq.call(this,{
        "method": "torrent-start"
    })
    .then(function(){
        that.status.paused = false
    })
}


module.exports = Object.create( Abstract )
.extend({
    init: init,

    updateTorrentList: updateTorrentList,
    updateStatus: updateStatus,

    hasTorrent: hasTorrent,
    addTorrent: addTorrent,

    pauseAll: pauseAll,
    startAll: startAll
})
