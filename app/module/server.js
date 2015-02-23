var Abstract = require('./abstract')
  , io = require('socket.io-client')
  , express = require('express')

var init = function( config, getStatus ){
    Abstract.init.call( this )

    this._getStatus = getStatus
    initApp.call(this, config)


    return this
}

var initApp = function( config ){

    var app = express()
    var FRONT_DIR = process.mainModule.filename.replace(/\\/g, '/').split('/').slice(0, -2).join('/')+'/front/'

    // static serve
    app.get("/", function(req, res){
        res.status(200).sendFile(FRONT_DIR+'index.html');
    })
    app.get("/bundle.js", function(req, res){
        res.status(200).sendFile(FRONT_DIR+'bundle.js');
    })
    app.get("/bundle.css", function(req, res){
        res.status(200).sendFile(FRONT_DIR+'bundle.css');
    })

    // actions
    var getStatus = this._getStatus
    var emit = this.emit.bind( this )
    var returnStatus = function( res ){
        getStatus()
        .then( function(x){
            res.send(x)
        })
    }
    app.get("/transmission/status", function(req, res){
        returnStatus( res )
    })
    app.get("/transmission/stop", function(req, res){
        emit('ask-transmission-stop')
        returnStatus( res )
    })
    app.get("/transmission/start", function(req, res){
        emit('ask-transmission-start')
        returnStatus( res )
    })
    app.get("/kodi/scan", function(req, res){
        emit('ask-scan')
        returnStatus( res )
    })

    app.listen( config.port )

    this.app = app
}

module.exports = Object.create( Abstract )
.extend({
    init: init
})
