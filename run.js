var fs = require('fs')
  , Promise = require('promise')
  , request = require('request')
  , killTransmission = require('./kill-transmission')
  , sorttv = require('./sorttv')
  , scanRSS = require('./scan-RSS')
  , Transmission = require('./transmission')
  , Kodi = require('./kodi')
  , historyL = require('./historyL')

var config = JSON.parse( fs.readFileSync('./config.json') );


var transmission = Object.create( Transmission ).init( config.transmission )
var kodi = Object.create( Kodi ).init( config.kodi )

transmission.startAll()

var analyzeAllRSS = (function(){

    var aSimilarTob = function( a,b ){
        return b.name.indexOf( a.name )>=0
    }

    // flatten the torrent list into something more comprehensive
    // also discard some duplicated entries
    var extractList = function( jrss ){

        // wahtever the rss always contains one channel
        return jrss.rss.channel.reduce(function(prev, c){

            // flatten
            var arr = c.item
            .map(function(c){
                return {
                    link: c.link[0],
                    name: c.title[0]
                }
            })

            // sometimes the rss contains two torrents for one show ( full hd and not full hd )
            // title are "xxx" and "xxx 720p"
            // keep only the 720p ( lets say its the one with the longest title )
            var arr2 = arr.filter(function(c){

                var similar = arr.filter( aSimilarTob.bind( null, c ))

                return similar.length>1
            })

            return prev.concat( arr2 )
        },[])
    }

    // check if the torrent is suitable, then add it with transmission
    var withList = function( list ){
        for( var i=list.length;i--;)
            if( !historyL.inList( list[i].name ) && !transmission.hasTorrent( list[i] ))
            {
                transmission.addTorrent( list[i] )
                historyL.write( list[i].name )
            }
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

var timeStamp = function( d ){
    d = new Date( d || Date.now() )
    return d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()+' '+d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear()
}

var k=100
;(function cycle(){

    console.log('---   cycle '+timeStamp())

    var p = transmission.refreshTorrentList()
    .then( grabEvents )
    .then( analyzeAllRSS.bind(null, config.RSS ) )


    if ( k++ > 10 )
    {
        k=0
        console.log('---   scan')
        p.then( scan() )
    }

    p
    .then( function(){
        setTimeout(cycle, config.pooling_delay)
    })
    .then(null, console.log.bind(console))

})()

require('./app')( config, transmission, kodi )
