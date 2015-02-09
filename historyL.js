var fs = require('fs')
  , Promise = require('promise')


var match = function( a,b ){
    return a==b
}
var inList = function( name ){
    return !!( new String(fs.readFileSync('./history')) ).split('\n').filter( match.bind( null, name ) ).length
}
var write = function( name ){
    var s = ( new String(fs.readFileSync('./history')) ).split('\n')
    if( s.filter( match.bind( null, name ) ).length )
        return
    s.push( name )
    fs.writeFileSync('./history', s.join('\n'))
}

module.exports = {
    inList: inList,
    write: write
}
