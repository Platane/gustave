(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
    init:function(){ return this},
    extend:function(o){
        for(var i in o ){
            this[i] = o[i]
        }
        return this
    }
}

},{}],2:[function(require,module,exports){
var listen = function( fn , key ){
    if( !this._listener )
        this._listener = []
    this._listener.push({ fn:fn,key:key})

    return this
}
var unlisten = function( keyOrFn ){
    if( !this._listener )
        return

    if( !keyOrFn )
        this._listener.length=0

    for(var i=this._listener.length;i--;)
        if( this._listener[i].fn == keyOrFn || ( this._listener[i].key && this._listener[i].key == keyOrFn ) )
            this._listener.splice(i,1)

    return this
}
var hasChanged = function(){
    for(var i=(this._listener||[]).length;i--;)
        this._listener[i].fn( this )

    return this
}

module.exports = {
    listen : listen,
    unlisten : unlisten,
    hasChanged : hasChanged
}

},{}],3:[function(require,module,exports){
var Notifier = require('./Notifier')
  , Abstract = require('./Abstract')
  , transport = require('./transport')

var syncStatus = function(){
    var that = this
    transport.get('/transmission/status')
    .then(function(s){
        that.status = JSON.parse(s)
        that.hasChanged()
    })
    return this
}
var stop = function(){
    var that = this
    transport.get('/transmission/stop')
    .then(function(s){
        that.status = JSON.parse(s)
        that.hasChanged()
    })
    return this
}
var start = function(){
    var that = this
    transport.get('/transmission/start')
    .then(function(s){
        that.status = JSON.parse(s)
        that.hasChanged()
    })
    return this
}

module.exports = Object.create( Abstract )
.extend( Notifier )
.extend({
    syncStatus: syncStatus,
    stop: stop,
    start: start,
})

},{"./Abstract":1,"./Notifier":2,"./transport":6}],4:[function(require,module,exports){
var dom = require('./domHelper')
  , TransmissionModel = require('./TransmissionModel')

var tr_model = Object.create( TransmissionModel ).syncStatus()



var button = document.querySelector('.switch')
var explaination = document.querySelector('.explaination')

dom.bind( button, 'click', function(){
    tr_model.stop();
})
tr_model.listen(function(){
    if( !tr_model.status.planned_restart ) {
        dom.removeClass( button, 'paused' )
        explaination.innerHTML = '<p>click the button to stop the transfert for one hour</p>'
    }
    else
    {
        dom.addClass( button, 'paused' )
        var min = Math.round( (tr_model.status.planned_restart-Date.now()) / 60000 )
        explaination.innerHTML = '<p>The transfert is currently paused, it will restart in '+min+' minutes</p><p>click the button to stop the transfert for one hour more</p>'
    }
})



var prevDate = 0
;(function cycle(){

    if( Date.now() - prevDate > 1000 ){
        tr_model.syncStatus()
        prevDate = Date.now()
    }

    window.requestAnimationFrame( cycle )
})()

},{"./TransmissionModel":3,"./domHelper":5}],5:[function(require,module,exports){
module.exports = {
    hasClass : function( el , c ){
		return el.classList.contains(c)
	},
	addClass : function( el , c ){
		el.className += ' '+c
	},
	removeClass : function( el , c ){
		var nc=""
		for(var i=el.classList.length;i--; )
			if( c != el.classList[i] )
				nc += ' '+el.classList[i]
		el.className = nc
	},
	getParent : function( el , c ){
		while(true)
			if( el && !this.hasClass( el , c ) )
				el = el.parentElement
			else
				break;
		return el
	},
	bind : function( el , eventName , fn ){

		var l = eventName.split(' ')
		if( l.length>1 ){
			for(var i=l.length;i--;)
				this.bind( el , l[i] , fn )
			return
		}


		el._bindHandlers = el._bindHandlers || {}

		this.unbind( el , eventName )

		el.addEventListener( eventName.split('.')[0] , fn , false )
		el._bindHandlers[ eventName ] = fn
	},
	unbind : function( el , eventName ){

		var l = eventName.split(' ')
		if( l.length>1 ){
			for(var i=l.length;i--;)
				this.unbind( el , l[i] )
			return
		}

		if( !el._bindHandlers || !el._bindHandlers[ eventName ] )
			return

		el.removeEventListener( eventName.split('.')[0] , el._bindHandlers[ eventName ] , false )
		el._bindHandlers[ eventName ] = null
	},
    domify : (function(){
        if( typeof document != 'object' )
            return function(){}
        var tank = document.createElement('div')
        return function( tpl ){
            tank.innerHTML = tpl
            var domEl = tank.children[ 0 ]
            tank.innerHTML = ''
            return domEl
        }
    })()
}

},{}],6:[function(require,module,exports){

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

},{}]},{},[4])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiZnJvbnRcXEFic3RyYWN0LmpzIiwiZnJvbnRcXE5vdGlmaWVyLmpzIiwiZnJvbnRcXFRyYW5zbWlzc2lvbk1vZGVsLmpzIiwiZnJvbnRcXGFwcC5qcyIsImZyb250XFxkb21IZWxwZXIuanMiLCJmcm9udFxcdHJhbnNwb3J0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGluaXQ6ZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXN9LFxyXG4gICAgZXh0ZW5kOmZ1bmN0aW9uKG8pe1xyXG4gICAgICAgIGZvcih2YXIgaSBpbiBvICl7XHJcbiAgICAgICAgICAgIHRoaXNbaV0gPSBvW2ldXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbn1cclxuIiwidmFyIGxpc3RlbiA9IGZ1bmN0aW9uKCBmbiAsIGtleSApe1xyXG4gICAgaWYoICF0aGlzLl9saXN0ZW5lciApXHJcbiAgICAgICAgdGhpcy5fbGlzdGVuZXIgPSBbXVxyXG4gICAgdGhpcy5fbGlzdGVuZXIucHVzaCh7IGZuOmZuLGtleTprZXl9KVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbn1cclxudmFyIHVubGlzdGVuID0gZnVuY3Rpb24oIGtleU9yRm4gKXtcclxuICAgIGlmKCAhdGhpcy5fbGlzdGVuZXIgKVxyXG4gICAgICAgIHJldHVyblxyXG5cclxuICAgIGlmKCAha2V5T3JGbiApXHJcbiAgICAgICAgdGhpcy5fbGlzdGVuZXIubGVuZ3RoPTBcclxuXHJcbiAgICBmb3IodmFyIGk9dGhpcy5fbGlzdGVuZXIubGVuZ3RoO2ktLTspXHJcbiAgICAgICAgaWYoIHRoaXMuX2xpc3RlbmVyW2ldLmZuID09IGtleU9yRm4gfHwgKCB0aGlzLl9saXN0ZW5lcltpXS5rZXkgJiYgdGhpcy5fbGlzdGVuZXJbaV0ua2V5ID09IGtleU9yRm4gKSApXHJcbiAgICAgICAgICAgIHRoaXMuX2xpc3RlbmVyLnNwbGljZShpLDEpXHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxufVxyXG52YXIgaGFzQ2hhbmdlZCA9IGZ1bmN0aW9uKCl7XHJcbiAgICBmb3IodmFyIGk9KHRoaXMuX2xpc3RlbmVyfHxbXSkubGVuZ3RoO2ktLTspXHJcbiAgICAgICAgdGhpcy5fbGlzdGVuZXJbaV0uZm4oIHRoaXMgKVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgbGlzdGVuIDogbGlzdGVuLFxyXG4gICAgdW5saXN0ZW4gOiB1bmxpc3RlbixcclxuICAgIGhhc0NoYW5nZWQgOiBoYXNDaGFuZ2VkXHJcbn1cclxuIiwidmFyIE5vdGlmaWVyID0gcmVxdWlyZSgnLi9Ob3RpZmllcicpXG4gICwgQWJzdHJhY3QgPSByZXF1aXJlKCcuL0Fic3RyYWN0JylcbiAgLCB0cmFuc3BvcnQgPSByZXF1aXJlKCcuL3RyYW5zcG9ydCcpXG5cbnZhciBzeW5jU3RhdHVzID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgdGhhdCA9IHRoaXNcbiAgICB0cmFuc3BvcnQuZ2V0KCcvdHJhbnNtaXNzaW9uL3N0YXR1cycpXG4gICAgLnRoZW4oZnVuY3Rpb24ocyl7XG4gICAgICAgIHRoYXQuc3RhdHVzID0gSlNPTi5wYXJzZShzKVxuICAgICAgICB0aGF0Lmhhc0NoYW5nZWQoKVxuICAgIH0pXG4gICAgcmV0dXJuIHRoaXNcbn1cbnZhciBzdG9wID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgdGhhdCA9IHRoaXNcbiAgICB0cmFuc3BvcnQuZ2V0KCcvdHJhbnNtaXNzaW9uL3N0b3AnKVxuICAgIC50aGVuKGZ1bmN0aW9uKHMpe1xuICAgICAgICB0aGF0LnN0YXR1cyA9IEpTT04ucGFyc2UocylcbiAgICAgICAgdGhhdC5oYXNDaGFuZ2VkKClcbiAgICB9KVxuICAgIHJldHVybiB0aGlzXG59XG52YXIgc3RhcnQgPSBmdW5jdGlvbigpe1xuICAgIHZhciB0aGF0ID0gdGhpc1xuICAgIHRyYW5zcG9ydC5nZXQoJy90cmFuc21pc3Npb24vc3RhcnQnKVxuICAgIC50aGVuKGZ1bmN0aW9uKHMpe1xuICAgICAgICB0aGF0LnN0YXR1cyA9IEpTT04ucGFyc2UocylcbiAgICAgICAgdGhhdC5oYXNDaGFuZ2VkKClcbiAgICB9KVxuICAgIHJldHVybiB0aGlzXG59XG5cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmNyZWF0ZSggQWJzdHJhY3QgKVxuLmV4dGVuZCggTm90aWZpZXIgKVxuLmV4dGVuZCh7XG4gICAgc3luY1N0YXR1czogc3luY1N0YXR1cyxcbiAgICBzdG9wOiBzdG9wLFxuICAgIHN0YXJ0OiBzdGFydCxcbn0pXG4iLCJ2YXIgZG9tID0gcmVxdWlyZSgnLi9kb21IZWxwZXInKVxuICAsIFRyYW5zbWlzc2lvbk1vZGVsID0gcmVxdWlyZSgnLi9UcmFuc21pc3Npb25Nb2RlbCcpXG5cbnZhciB0cl9tb2RlbCA9IE9iamVjdC5jcmVhdGUoIFRyYW5zbWlzc2lvbk1vZGVsICkuc3luY1N0YXR1cygpXG5cblxuXG52YXIgYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnN3aXRjaCcpXG52YXIgZXhwbGFpbmF0aW9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmV4cGxhaW5hdGlvbicpXG5cbmRvbS5iaW5kKCBidXR0b24sICdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgdHJfbW9kZWwuc3RvcCgpO1xufSlcbnRyX21vZGVsLmxpc3RlbihmdW5jdGlvbigpe1xuICAgIGlmKCAhdHJfbW9kZWwuc3RhdHVzLnBsYW5uZWRfcmVzdGFydCApIHtcbiAgICAgICAgZG9tLnJlbW92ZUNsYXNzKCBidXR0b24sICdwYXVzZWQnIClcbiAgICAgICAgZXhwbGFpbmF0aW9uLmlubmVySFRNTCA9ICc8cD5jbGljayB0aGUgYnV0dG9uIHRvIHN0b3AgdGhlIHRyYW5zZmVydCBmb3Igb25lIGhvdXI8L3A+J1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgICBkb20uYWRkQ2xhc3MoIGJ1dHRvbiwgJ3BhdXNlZCcgKVxuICAgICAgICB2YXIgbWluID0gTWF0aC5yb3VuZCggKHRyX21vZGVsLnN0YXR1cy5wbGFubmVkX3Jlc3RhcnQtRGF0ZS5ub3coKSkgLyA2MDAwMCApXG4gICAgICAgIGV4cGxhaW5hdGlvbi5pbm5lckhUTUwgPSAnPHA+VGhlIHRyYW5zZmVydCBpcyBjdXJyZW50bHkgcGF1c2VkLCBpdCB3aWxsIHJlc3RhcnQgaW4gJyttaW4rJyBtaW51dGVzPC9wPjxwPmNsaWNrIHRoZSBidXR0b24gdG8gc3RvcCB0aGUgdHJhbnNmZXJ0IGZvciBvbmUgaG91ciBtb3JlPC9wPidcbiAgICB9XG59KVxuXG5cblxudmFyIHByZXZEYXRlID0gMFxuOyhmdW5jdGlvbiBjeWNsZSgpe1xuXG4gICAgaWYoIERhdGUubm93KCkgLSBwcmV2RGF0ZSA+IDEwMDAgKXtcbiAgICAgICAgdHJfbW9kZWwuc3luY1N0YXR1cygpXG4gICAgICAgIHByZXZEYXRlID0gRGF0ZS5ub3coKVxuICAgIH1cblxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoIGN5Y2xlIClcbn0pKClcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgaGFzQ2xhc3MgOiBmdW5jdGlvbiggZWwgLCBjICl7XHJcblx0XHRyZXR1cm4gZWwuY2xhc3NMaXN0LmNvbnRhaW5zKGMpXHJcblx0fSxcclxuXHRhZGRDbGFzcyA6IGZ1bmN0aW9uKCBlbCAsIGMgKXtcclxuXHRcdGVsLmNsYXNzTmFtZSArPSAnICcrY1xyXG5cdH0sXHJcblx0cmVtb3ZlQ2xhc3MgOiBmdW5jdGlvbiggZWwgLCBjICl7XHJcblx0XHR2YXIgbmM9XCJcIlxyXG5cdFx0Zm9yKHZhciBpPWVsLmNsYXNzTGlzdC5sZW5ndGg7aS0tOyApXHJcblx0XHRcdGlmKCBjICE9IGVsLmNsYXNzTGlzdFtpXSApXHJcblx0XHRcdFx0bmMgKz0gJyAnK2VsLmNsYXNzTGlzdFtpXVxyXG5cdFx0ZWwuY2xhc3NOYW1lID0gbmNcclxuXHR9LFxyXG5cdGdldFBhcmVudCA6IGZ1bmN0aW9uKCBlbCAsIGMgKXtcclxuXHRcdHdoaWxlKHRydWUpXHJcblx0XHRcdGlmKCBlbCAmJiAhdGhpcy5oYXNDbGFzcyggZWwgLCBjICkgKVxyXG5cdFx0XHRcdGVsID0gZWwucGFyZW50RWxlbWVudFxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRyZXR1cm4gZWxcclxuXHR9LFxyXG5cdGJpbmQgOiBmdW5jdGlvbiggZWwgLCBldmVudE5hbWUgLCBmbiApe1xyXG5cclxuXHRcdHZhciBsID0gZXZlbnROYW1lLnNwbGl0KCcgJylcclxuXHRcdGlmKCBsLmxlbmd0aD4xICl7XHJcblx0XHRcdGZvcih2YXIgaT1sLmxlbmd0aDtpLS07KVxyXG5cdFx0XHRcdHRoaXMuYmluZCggZWwgLCBsW2ldICwgZm4gKVxyXG5cdFx0XHRyZXR1cm5cclxuXHRcdH1cclxuXHJcblxyXG5cdFx0ZWwuX2JpbmRIYW5kbGVycyA9IGVsLl9iaW5kSGFuZGxlcnMgfHwge31cclxuXHJcblx0XHR0aGlzLnVuYmluZCggZWwgLCBldmVudE5hbWUgKVxyXG5cclxuXHRcdGVsLmFkZEV2ZW50TGlzdGVuZXIoIGV2ZW50TmFtZS5zcGxpdCgnLicpWzBdICwgZm4gLCBmYWxzZSApXHJcblx0XHRlbC5fYmluZEhhbmRsZXJzWyBldmVudE5hbWUgXSA9IGZuXHJcblx0fSxcclxuXHR1bmJpbmQgOiBmdW5jdGlvbiggZWwgLCBldmVudE5hbWUgKXtcclxuXHJcblx0XHR2YXIgbCA9IGV2ZW50TmFtZS5zcGxpdCgnICcpXHJcblx0XHRpZiggbC5sZW5ndGg+MSApe1xyXG5cdFx0XHRmb3IodmFyIGk9bC5sZW5ndGg7aS0tOylcclxuXHRcdFx0XHR0aGlzLnVuYmluZCggZWwgLCBsW2ldIClcclxuXHRcdFx0cmV0dXJuXHJcblx0XHR9XHJcblxyXG5cdFx0aWYoICFlbC5fYmluZEhhbmRsZXJzIHx8ICFlbC5fYmluZEhhbmRsZXJzWyBldmVudE5hbWUgXSApXHJcblx0XHRcdHJldHVyblxyXG5cclxuXHRcdGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoIGV2ZW50TmFtZS5zcGxpdCgnLicpWzBdICwgZWwuX2JpbmRIYW5kbGVyc1sgZXZlbnROYW1lIF0gLCBmYWxzZSApXHJcblx0XHRlbC5fYmluZEhhbmRsZXJzWyBldmVudE5hbWUgXSA9IG51bGxcclxuXHR9LFxyXG4gICAgZG9taWZ5IDogKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgaWYoIHR5cGVvZiBkb2N1bWVudCAhPSAnb2JqZWN0JyApXHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpe31cclxuICAgICAgICB2YXIgdGFuayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCB0cGwgKXtcclxuICAgICAgICAgICAgdGFuay5pbm5lckhUTUwgPSB0cGxcclxuICAgICAgICAgICAgdmFyIGRvbUVsID0gdGFuay5jaGlsZHJlblsgMCBdXHJcbiAgICAgICAgICAgIHRhbmsuaW5uZXJIVE1MID0gJydcclxuICAgICAgICAgICAgcmV0dXJuIGRvbUVsXHJcbiAgICAgICAgfVxyXG4gICAgfSkoKVxyXG59XHJcbiIsIlxyXG52YXIgZW5jb2RlQXV0aCA9IGZ1bmN0aW9uKCBsb2dpbiAsIHBhc3N3b3JkICl7XHJcbiAgICByZXR1cm4gJ0Jhc2ljICcrYnRvYSggbG9naW4rJzonK3Bhc3N3b3JkICk7XHJcbn1cclxuXHJcbi8qXHJcbiAqIHNpbXBsZSBoeHIgd3JhcHBlclxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxudmFyIHJlcXVlc3QgPSBmdW5jdGlvbiggdXJsICwgb3B0aW9ucyApe1xyXG5cclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XHJcblxyXG4gICAgaWYoIG9wdGlvbnMubG9naW4gJiYgb3B0aW9ucy5wYXNzd29yZCApXHJcbiAgICAgICAgKCBvcHRpb25zLmhlYWRlcnMgPSBvcHRpb25zLmhlYWRlcnMgfHwge30gKVsgJ0F1dGhvcml6YXRpb24nIF0gPSBlbmNvZGVBdXRoKCBvcHRpb25zLmxvZ2luICwgb3B0aW9ucy5wYXNzd29yZCApXHJcblxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUscmVqZWN0ZWQpe1xyXG5cclxuICAgICAgICB2YXIgc3VjY2VzcyA9IGZ1bmN0aW9uKCByZXAgKXtcclxuICAgICAgICAgICAgaWYoIHJlcC50YXJnZXQuc3RhdHVzICE9IDIwMCB8fCAhcmVwLnRhcmdldC5yZXNwb25zZVRleHQubGVuZ3RoICApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0ZWQoIHJlcC50YXJnZXQgKVxyXG5cclxuICAgICAgICAgICAgaWYoIHJlcC50YXJnZXQuc3RhdHVzID09IDIwMCAgKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoIHJlcC50YXJnZXQucmVzcG9uc2VUZXh0IClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBlcnJvciAgPSBmdW5jdGlvbiggcmVwICl7XHJcbiAgICAgICAgICAgIHJlamVjdGVkKCByZXAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3Qoe21velN5c3RlbTogdHJ1ZX0pO1xyXG4gICAgICAgIHhoci5vcGVuKCBvcHRpb25zLnZlcmIgfHwgKCBvcHRpb25zLmRhdGEgPyAnUE9TVCcgOiAnR0VUJyApICwgdXJsICwgdHJ1ZSk7XHJcblxyXG4gICAgICAgIC8vIGNhbGxiYWNrc1xyXG4gICAgICAgIHhoci5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIGVycm9yICwgZmFsc2UpO1xyXG4gICAgICAgIHhoci5hZGRFdmVudExpc3RlbmVyKCdhYm9ydCcsIGVycm9yICwgZmFsc2UpO1xyXG4gICAgICAgIHhoci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgc3VjY2VzcyAsIGZhbHNlKTtcclxuXHJcbiAgICAgICAgLy8gaGVhZGVyc1xyXG4gICAgICAgIGZvciggdmFyIGtleSBpbiBvcHRpb25zLmhlYWRlcnMgfHwge30gKVxyXG4gICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcigga2V5ICwgb3B0aW9ucy5oZWFkZXJzWyBrZXkgXSApXHJcblxyXG4gICAgICAgIC8vIHNlbmRcclxuICAgICAgICB4aHIuc2VuZCggb3B0aW9ucy5kYXRhICk7XHJcbiAgICB9KVxyXG59XHJcblxyXG5cclxuXHJcblxyXG52YXIgZ2V0ID0gZnVuY3Rpb24oIHVybCAsIG9wdGlvbnMgKXtcclxuICAgICggb3B0aW9ucyA9IG9wdGlvbnMgfHwge30gKS52ZXJiID0gJ0dFVCdcclxuICAgIHJldHVybiByZXF1ZXN0KCB1cmwgLCBvcHRpb25zIClcclxufVxyXG5cclxudmFyIHB1dCA9IGZ1bmN0aW9uKCB1cmwgLCBvcHRpb25zICl7XHJcbiAgICAoIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9ICkudmVyYiA9ICdQVVQnXHJcbiAgICByZXR1cm4gcmVxdWVzdCggdXJsICwgb3B0aW9ucyApXHJcbn1cclxuXHJcbnZhciBwb3N0ID0gZnVuY3Rpb24oIHVybCAsIG9wdGlvbnMgKXtcclxuICAgICggb3B0aW9ucyA9IG9wdGlvbnMgfHwge30gKS52ZXJiID0gJ1BVVCdcclxuICAgIHJldHVybiByZXF1ZXN0KCB1cmwgLCBvcHRpb25zIClcclxufVxyXG5cclxudmFyIG1vY2tSZXF1ZXN0ID0gZnVuY3Rpb24oIHVybCAsIG9wdGlvbnMgKXtcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUscmVqZWN0ZWQpe1xyXG4gICAgICAgIHNldFRpbWVvdXQoIGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgICAgICBzd2l0Y2goIG9wdGlvbnMudmVyYiApe1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ0dFVCcgOlxyXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShmYWtlSW5kZXgpXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICB9ICwgKE1hdGgucmFuZG9tKCkqMTAwMCsxMDApPDwwIClcclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHB1dCA6IHB1dCxcclxuICAgIHBvc3QgOiBwb3N0LFxyXG4gICAgZ2V0IDogZ2V0LFxyXG5cclxuICAgIHJlcXVlc3Q6cmVxdWVzdFxyXG4gICAgLy9yZXF1ZXN0Om1vY2tSZXF1ZXN0XHJcbn1cclxuIl19
