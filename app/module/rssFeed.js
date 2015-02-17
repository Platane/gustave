var xml2js = require('xml2js')
  , request = require('request')
  , Promise = require('promise')
  , Abstract = require('./abstract')

var init = function(){
    Abstract.init.call( this )
    this.status.scanning = false
}
var get = function( url ){
    return new Promise(function(resolve, reject){
        request(
            {
                method: 'GET',
                uri: url
            },
            function(err, response, body){
                if( err )
                    return reject( err )

                if( response.statusCode == 200 )
                    return xml2js.parseString( body, function( err, res ){
                        if( err )
                            reject( err )
                        resolve( res )
                    })
                else
                    return reject( response )
            }
        )
    })
}
var scan = (function(){

    var aSimilarTob = function( a,b ){
        return b.name.indexOf( a.name )>=0
    }

    // flatten the torrent list into something more comprehensive
    // also discard some duplicated entries
    var extractList = function( jrss ){

        // whatever the rss always contains one channel
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

    // dispatch event
    var dispatch = function( list ){
        list.forEach( this.dispatch.bind( this, 'torrent' ))
    }

    return function( _rss ){

        var that = this
        var arr = _rss.reduce(function(prev, url){
            var p = get( url )
            .then( extractList )
            .then( dispatch.bind( that ) )

            prev.push( p )
            return prev
        })

        return Promise.all( arr )
    }

})()



module.exports = Abstract.extend({
    init : init,
    scan : scan
})
