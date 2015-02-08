var fs = require('fs')
  , Promise = require('promise')
  , express = require('express')
  , request = require('request')
  , killTransmission = require('./kill-transmission')
  , sorttv = require('./sorttv')
  , scanRSS = require('./scan-RSS')
  , Transmission = require('./transmission')
  , Kodi = require('./kodi')

var config = JSON.parse( fs.readFileSync('./config.json') );


var transmission = Object.create( Transmission ).init( config.transmission )
var kodi = Object.create( Kodi ).init( config.kodi )


var analyzeAllRSS = (function(){

    var extractList = function( jrss ){
        return jrss.rss.channel.reduce(function(prev, c){
            return prev.concat(c.item.map(function(c){
                return {
                    link: c.link[0],
                    name: c.title[0]
                }
            }))
        },[])
    }

    var withList = function( list ){
        for( var i=list.length;i--;)
            if( !transmission.hasTorrent( list[i] ))
                transmission.addTorrent( list[i] )
    }

    var i,rss;
    var incr = function(){ i++ }
    var next = function(){
        if( i>=rss.length )
            return Promise.resolve()
        else
            return scanRSS
                .get( rss[i] )
                .then( extractList )
                .then( withList )
                .then( incr )
                .then( next )
    }
    return function( _rss ){
        rss = _rss
        i = 0;
        return next()
    }

})()

var scan = function(){
    return sorttv.crawl()
    .then( kodi.scan() )
}


var grabEvents = function( patch ){
    return patch
}

var k=0
;(function cycle(){

    console.log('cycle')

    var p = transmission.refreshTorrentList()
    .then( grabEvents )
    .then( analyzeAllRSS.bind(null, config.RSS ) )


    if ( k++ > 10 )
    {
        k=0
        p.then( scan() )
    }

    p
    .then( function(){
        setTimeout(cycle, config.pooling_delay)
    })
    .then(null, console.log.bind(console))

})()



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
        o.planned_restart = planned_restart
        return o
    })
}

var app = express()
var DIR = process.mainModule.filename.substr(0,-6)

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


app.get("/", function(req, res){
    res.status(200).sendFile(DIR+'front/index.html');
})
app.get("/bundle.js", function(req, res){
    res.status(200).sendFile(DIR+'front/bundle.js');
})
app.get("/bundle.css", function(req, res){
    res.status(200).sendFile(DIR+'\\front\\bundle.css');
})


app.listen( config.port )
