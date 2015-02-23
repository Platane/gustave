var child_process = require('child_process')
  , Promise = require('promise')


module.exports = function exec ( cmd ){
    return new Promise( function(resolve, reject){
        child_process.exec( cmd, function(err, out, code){
            if( err )
                reject({
                    err: err,
                    code: code,
                    cmd: cmd
                })
            resolve( out )
        })
    })
}
