var request = require('request')
  , Promise = require('promise')


var trReq = function( req, retry ){
    var that = this
    var uri = 'http://'+this.config.host+':'+this.config.port+'/jsonrpc'

    if( retry > 5 )
        return Promise.reject('max retry')

    return new Promise(function(resolve, reject){
        request({
            method: 'POST',
            uri: uri,
            json: true,
            body: req,
            headers: {
                'Content-Type': 'application/json'
            },
            timeout : 20000
        },
        function(err, response, body){
            if( err )
                return reject( err )

            if( response.statusCode == 200 )
                return resolve( body )

            return reject( response )
        })

    })
}


var init = function( config ){
    this.config = config

    return this
}



module.exports = {
    init: init,

    scan: function(){ return trReq.call(this, {'method': 'VideoLibrary.Scan'}) }
}
