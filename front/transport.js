
var encodeAuth = function( login , password ){
    return 'Basic '+btoa( login+':'+password );
}

/*
 * simple hxr wrapper
 * @return {Promise}
 */
var request = function( url , options ){

    options = options || {}

    if( options.login && options.password )
        ( options.headers = options.headers || {} )[ 'Authorization' ] = encodeAuth( options.login , options.password )

    return new Promise(function(resolve,rejected){

        var success = function( rep ){
            if( rep.target.status != 200 || !rep.target.responseText.length  )
                return rejected( rep.target )

            if( rep.target.status == 200  )
                return resolve( rep.target.responseText )
        }

        var error  = function( rep ){
            rejected( rep );
        }

        var xhr = new XMLHttpRequest({mozSystem: true});
        xhr.open( options.verb || ( options.data ? 'POST' : 'GET' ) , url , true);

        // callbacks
        xhr.addEventListener('error', error , false);
        xhr.addEventListener('abort', error , false);
        xhr.addEventListener('load', success , false);

        // headers
        for( var key in options.headers || {} )
            xhr.setRequestHeader( key , options.headers[ key ] )

        // send
        xhr.send( options.data );
    })
}




var get = function( url , options ){
    ( options = options || {} ).verb = 'GET'
    return request( url , options )
}

var put = function( url , options ){
    ( options = options || {} ).verb = 'PUT'
    return request( url , options )
}

var post = function( url , options ){
    ( options = options || {} ).verb = 'PUT'
    return request( url , options )
}

var mockRequest = function( url , options ){
    options = options || {}

    return new Promise(function(resolve,rejected){
        setTimeout( function(){

            switch( options.verb ){
                    case 'GET' :
                    default :
                        return resolve(fakeIndex)
                }


        } , (Math.random()*1000+100)<<0 )
    })
}


module.exports = {
    put : put,
    post : post,
    get : get,

    request:request
    //request:mockRequest
}
