var fs = require('fs')
  , Promise = require('promise')

var ROOT_DIR = process.mainModule.filename.replace(/\\/g, '/').split('/').slice(0, -2).join('/')+'/'
var config = JSON.parse( fs.readFileSync(ROOT_DIR+'config.json') );


var getStatus = function(){

    var arr = []
    for( var i in mods )
        if( mods[ i ].updateStatus )
            arr.push( mods[ i ].updateStatus() )

    return Promise.all( arr )
    .then(function(){
        var s = {}
        for( var i in mods )
            if( mods[ i ].status )
                s[ i ] = mods[ i ].status
        return s
    })
}

var mods = {
    kodi: require('./module/kodi').ne( config.kodi ),
    transmission: require('./module/transmission').ne( config.transmission ),
    rss: require('./module/rssFeed').ne( config.rss ),
    sorttv: require('./module/sorttv').ne( ),
    timer: require('./module/timer').ne( config ),

    server: require('./module/server').ne( config.server, getStatus ),
}

var scripts = {
    //afterTransmissionComplete : require('./script/afterTransmissionComplete'),
    serverActionStopTransmission : require('./script/serverActionStopTransmission'),
    manualScan : require('./script/manualScan'),
}


// log all the thing

var log = (function(){
    var twoDigit = function( x ){
        x = x+''
        while( x.length <2 )
            x = '0'+x
        return x
    }
    var timeStamp = function( d ){
        d = new Date( d || Date.now() )
        return  twoDigit( d.getHours() )+':'+
        twoDigit( d.getMinutes() )+':'+
        twoDigit( d.getSeconds() )+' '+
        twoDigit( d.getDate() )+'/'+
        twoDigit( d.getMonth()+1 )+'/'+
        d.getFullYear()
    }
    return function( x ){
        console.log( '['+timeStamp()+'] ', x )
    }
})()
var l = function( m, e ){
    mods[ m ].on( e , log.bind(null,m+':'+e) )
}
l( 'server', 'ask-transmission-stop' )
l( 'server', 'ask-scan' )
l( 'timer', 'pause' )
l( 'timer', 'unpause' )
l( 'kodi', 'scan-end' )
l( 'kodi', 'scan-start' )
l( 'kodi', 'update-entry' )
l( 'sorttv', 'scan-end' )
l( 'sorttv', 'scan-start' )



for( var i in scripts )
{
    scripts[ i ] = scripts[ i ].ne( mods )
    scripts[ i ].enable()
}
console.log('started')
