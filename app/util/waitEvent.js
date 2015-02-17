var Promise = require('promise')

module.exports = function( ee, eventName, timeout ){
    return new Promise(function( resolve, reject ){
        ee.once( eventName, resolve )

        if ( timeout ){
            setTimeout(function(){
                ee.removeListener( eventName, resolve )
                reject()
            }, timeout )
        }
    })
}
