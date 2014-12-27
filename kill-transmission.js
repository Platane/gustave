var spawn = require('child_process').spawn
  , Promise = require('promise')


var exec = function( cmd, options ){
    return new Promise(function(resolve, reject){
        var proc = spawn( cmd , options )

        // monitor the error and standard output stream
        var buffer = []
        , stderr = ''

        proc.stdout.on('data', function (data) {
            buffer.push( data )
        })

        proc.stderr.on('data', function (data) {
            stderr += data
        })

        proc.on('close', function (code, signal) {

            // something bad happend
            if (code !== 0 || signal !== null)
                return reject({signal: signal, code: code, sterr: stderr})

            // is ok
            resolve( buffer )
        })
        .on('error', function(err){
            return reject({code: err, sterr: stderr})
        });

        proc.stdin.end()
    })
}

module.exports = {
    stop: exec.bind(null, 'sudo service transmission-daemon stop'),
    reload: exec.bind(null, 'sudo service transmission-daemon reload')
}
