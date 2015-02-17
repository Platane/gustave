var fs = require('fs')


var ROOT_DIR = process.mainModule.filename.replace(/\\/g, '/').split('/').slice(0, -2).join('/')
var config = JSON.parse( fs.readFileSync(ROOT_DIR+'config.json') );



var mods = {
    kodi: require('./module/kodi').ne( config.kodi ),
    transmission: require('./module/transmission').ne( config.transmission ),
    rss: require('./module/rssFeed').ne( config.rss ),
    sorttv: require('./module/sorttv').ne( ),
}

var scripts = {
    afterTransmissionComplete : require('./script/afterTransmissionComplete'),
}

for( var i in scripts )
{
    scripts[ i ] = scripts[ i ].ne( mods )
    scripts[ i ].enable()
}
