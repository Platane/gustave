var Promise = require('promise')

var errorHandling = function( err ){
    console.log( 'err', err )
}
var onEvent = function( data ){

    var p = Promise.resolve()

    this._chain.forEach(function( x ){
        p = p.then( x )
    })

    p.then( null, errorHandling )

    return p
}

var S = {
    init: function(){
        this._chain = []
        return this
    },
    then: function(x){
        this._chain.push( x )
        return this
    }
}

module.exports = function( ee, eventName ){

    var s = Object.create( S ).init()

    var cb = onEvent.bind( this )

    ee.on( eventName, cb )

    s.kill = ee.removeListener.bind( ee, eventName, cb )

    return s
}
