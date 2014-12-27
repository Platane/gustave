var xml2js = require('xml2js')
  , request = require('request')
  , Promise = require('promise')


var get = function( url ){
    return new Promise(function(resolve, reject){
        request({
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

            return reject( response )
        })
    })
}


module.exports = {
    get : get
}
