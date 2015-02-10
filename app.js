var express = require('express')
  , sorttv = require('./sorttv')

module.exports = function init ( config, transmission, kodi, scan ){


var timeStamp = function( d ){
    d = new Date( d || Date.now() )
    return d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()+' '+d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear()
}


var timeout, planned_restart=0;
var pauseForADelay = function(){
    planned_restart = Date.now() + config.pause_delay
    timeout = void clearTimeout( timeout )
    timeout = setTimeout( restart, config.pause_delay  )
    return transmission.pauseAll()
}
var restart = function(){
    planned_restart = 0
    timeout = void clearTimeout( timeout )
    return transmission.startAll()
}
var status = function(){
    return transmission.refreshStatus()
    .then(function(){
        var o = {}
        for(var p in transmission.status )
            o[p] = transmission.status[p]
        for(var p in scan.status )
            o[p] = scan.status[p]
        o.planned_restart = planned_restart
        return o
    })
}

var app = express()
var DIR = process.mainModule.filename.slice(0,-6)

app.get("/transmission/start", function(req, res){
    restart()
    .then( status )
    .then( function(x){
        res.send(x)
    })
})

app.get("/transmission/stop", function(req, res){
    pauseForADelay()
    .then( status )
    .then( function(x){
        res.send(x)
    })
})

app.get("/transmission/status", function(req, res){
    status()
    .then( function(x){
        res.send(x)
    })
})

app.get("/kodi/scan", function(req, res){
    console.log('---   manual scan '+timeStamp())
    scan.scan()
    status()
    .then( function(x){
        res.send(x)
    })
})


app.get("/", function(req, res){
    res.status(200).sendFile(DIR+'front/index.html');
})
app.get("/bundle.js", function(req, res){
    res.status(200).sendFile(DIR+'front/bundle.js');
})
app.get("/bundle.css", function(req, res){
    res.status(200).sendFile(DIR+'front/bundle.css');
})


app.listen( config.port )

}
