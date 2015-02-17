var wait = require('./waitEvent')

module.exports = function( condition, ee, eventName, timeout ){
    return function( x ){

        if ( condition(x) )
            return x
        else
            return wait( ee, eventName, timeout )
    }
}
