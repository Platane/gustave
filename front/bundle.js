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
var metrics = document.querySelector('.metrics')

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
    metrics.innerHTML = 'speed: '+tr_model.status.global_up+'B/s up   -   '+tr_model.status.global_down+'B/s down'
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiZnJvbnRcXEFic3RyYWN0LmpzIiwiZnJvbnRcXE5vdGlmaWVyLmpzIiwiZnJvbnRcXFRyYW5zbWlzc2lvbk1vZGVsLmpzIiwiZnJvbnRcXGFwcC5qcyIsImZyb250XFxkb21IZWxwZXIuanMiLCJmcm9udFxcdHJhbnNwb3J0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBpbml0OmZ1bmN0aW9uKCl7IHJldHVybiB0aGlzfSxcclxuICAgIGV4dGVuZDpmdW5jdGlvbihvKXtcclxuICAgICAgICBmb3IodmFyIGkgaW4gbyApe1xyXG4gICAgICAgICAgICB0aGlzW2ldID0gb1tpXVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG59XHJcbiIsInZhciBsaXN0ZW4gPSBmdW5jdGlvbiggZm4gLCBrZXkgKXtcclxuICAgIGlmKCAhdGhpcy5fbGlzdGVuZXIgKVxyXG4gICAgICAgIHRoaXMuX2xpc3RlbmVyID0gW11cclxuICAgIHRoaXMuX2xpc3RlbmVyLnB1c2goeyBmbjpmbixrZXk6a2V5fSlcclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG59XHJcbnZhciB1bmxpc3RlbiA9IGZ1bmN0aW9uKCBrZXlPckZuICl7XHJcbiAgICBpZiggIXRoaXMuX2xpc3RlbmVyIClcclxuICAgICAgICByZXR1cm5cclxuXHJcbiAgICBpZiggIWtleU9yRm4gKVxyXG4gICAgICAgIHRoaXMuX2xpc3RlbmVyLmxlbmd0aD0wXHJcblxyXG4gICAgZm9yKHZhciBpPXRoaXMuX2xpc3RlbmVyLmxlbmd0aDtpLS07KVxyXG4gICAgICAgIGlmKCB0aGlzLl9saXN0ZW5lcltpXS5mbiA9PSBrZXlPckZuIHx8ICggdGhpcy5fbGlzdGVuZXJbaV0ua2V5ICYmIHRoaXMuX2xpc3RlbmVyW2ldLmtleSA9PSBrZXlPckZuICkgKVxyXG4gICAgICAgICAgICB0aGlzLl9saXN0ZW5lci5zcGxpY2UoaSwxKVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbn1cclxudmFyIGhhc0NoYW5nZWQgPSBmdW5jdGlvbigpe1xyXG4gICAgZm9yKHZhciBpPSh0aGlzLl9saXN0ZW5lcnx8W10pLmxlbmd0aDtpLS07KVxyXG4gICAgICAgIHRoaXMuX2xpc3RlbmVyW2ldLmZuKCB0aGlzIClcclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGxpc3RlbiA6IGxpc3RlbixcclxuICAgIHVubGlzdGVuIDogdW5saXN0ZW4sXHJcbiAgICBoYXNDaGFuZ2VkIDogaGFzQ2hhbmdlZFxyXG59XHJcbiIsInZhciBOb3RpZmllciA9IHJlcXVpcmUoJy4vTm90aWZpZXInKVxuICAsIEFic3RyYWN0ID0gcmVxdWlyZSgnLi9BYnN0cmFjdCcpXG4gICwgdHJhbnNwb3J0ID0gcmVxdWlyZSgnLi90cmFuc3BvcnQnKVxuXG52YXIgc3luY1N0YXR1cyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIHRoYXQgPSB0aGlzXG4gICAgdHJhbnNwb3J0LmdldCgnL3RyYW5zbWlzc2lvbi9zdGF0dXMnKVxuICAgIC50aGVuKGZ1bmN0aW9uKHMpe1xuICAgICAgICB0aGF0LnN0YXR1cyA9IEpTT04ucGFyc2UocylcbiAgICAgICAgdGhhdC5oYXNDaGFuZ2VkKClcbiAgICB9KVxuICAgIHJldHVybiB0aGlzXG59XG52YXIgc3RvcCA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIHRoYXQgPSB0aGlzXG4gICAgdHJhbnNwb3J0LmdldCgnL3RyYW5zbWlzc2lvbi9zdG9wJylcbiAgICAudGhlbihmdW5jdGlvbihzKXtcbiAgICAgICAgdGhhdC5zdGF0dXMgPSBKU09OLnBhcnNlKHMpXG4gICAgICAgIHRoYXQuaGFzQ2hhbmdlZCgpXG4gICAgfSlcbiAgICByZXR1cm4gdGhpc1xufVxudmFyIHN0YXJ0ID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgdGhhdCA9IHRoaXNcbiAgICB0cmFuc3BvcnQuZ2V0KCcvdHJhbnNtaXNzaW9uL3N0YXJ0JylcbiAgICAudGhlbihmdW5jdGlvbihzKXtcbiAgICAgICAgdGhhdC5zdGF0dXMgPSBKU09OLnBhcnNlKHMpXG4gICAgICAgIHRoYXQuaGFzQ2hhbmdlZCgpXG4gICAgfSlcbiAgICByZXR1cm4gdGhpc1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE9iamVjdC5jcmVhdGUoIEFic3RyYWN0IClcbi5leHRlbmQoIE5vdGlmaWVyIClcbi5leHRlbmQoe1xuICAgIHN5bmNTdGF0dXM6IHN5bmNTdGF0dXMsXG4gICAgc3RvcDogc3RvcCxcbiAgICBzdGFydDogc3RhcnQsXG59KVxuIiwidmFyIGRvbSA9IHJlcXVpcmUoJy4vZG9tSGVscGVyJylcbiAgLCBUcmFuc21pc3Npb25Nb2RlbCA9IHJlcXVpcmUoJy4vVHJhbnNtaXNzaW9uTW9kZWwnKVxuXG52YXIgdHJfbW9kZWwgPSBPYmplY3QuY3JlYXRlKCBUcmFuc21pc3Npb25Nb2RlbCApLnN5bmNTdGF0dXMoKVxuXG5cblxudmFyIGJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5zd2l0Y2gnKVxudmFyIGV4cGxhaW5hdGlvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5leHBsYWluYXRpb24nKVxudmFyIG1ldHJpY3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubWV0cmljcycpXG5cbmRvbS5iaW5kKCBidXR0b24sICdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgdHJfbW9kZWwuc3RvcCgpO1xufSlcbnRyX21vZGVsLmxpc3RlbihmdW5jdGlvbigpe1xuICAgIGlmKCAhdHJfbW9kZWwuc3RhdHVzLnBsYW5uZWRfcmVzdGFydCApIHtcbiAgICAgICAgZG9tLnJlbW92ZUNsYXNzKCBidXR0b24sICdwYXVzZWQnIClcbiAgICAgICAgZXhwbGFpbmF0aW9uLmlubmVySFRNTCA9ICc8cD5jbGljayB0aGUgYnV0dG9uIHRvIHN0b3AgdGhlIHRyYW5zZmVydCBmb3Igb25lIGhvdXI8L3A+J1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgICBkb20uYWRkQ2xhc3MoIGJ1dHRvbiwgJ3BhdXNlZCcgKVxuICAgICAgICB2YXIgbWluID0gTWF0aC5yb3VuZCggKHRyX21vZGVsLnN0YXR1cy5wbGFubmVkX3Jlc3RhcnQtRGF0ZS5ub3coKSkgLyA2MDAwMCApXG4gICAgICAgIGV4cGxhaW5hdGlvbi5pbm5lckhUTUwgPSAnPHA+VGhlIHRyYW5zZmVydCBpcyBjdXJyZW50bHkgcGF1c2VkLCBpdCB3aWxsIHJlc3RhcnQgaW4gJyttaW4rJyBtaW51dGVzPC9wPjxwPmNsaWNrIHRoZSBidXR0b24gdG8gc3RvcCB0aGUgdHJhbnNmZXJ0IGZvciBvbmUgaG91ciBtb3JlPC9wPidcbiAgICB9XG4gICAgbWV0cmljcy5pbm5lckhUTUwgPSAnc3BlZWQ6ICcrdHJfbW9kZWwuc3RhdHVzLmdsb2JhbF91cCsnQi9zIHVwICAgLSAgICcrdHJfbW9kZWwuc3RhdHVzLmdsb2JhbF9kb3duKydCL3MgZG93bidcbn0pXG5cblxuXG52YXIgcHJldkRhdGUgPSAwXG47KGZ1bmN0aW9uIGN5Y2xlKCl7XG5cbiAgICBpZiggRGF0ZS5ub3coKSAtIHByZXZEYXRlID4gMTAwMCApe1xuICAgICAgICB0cl9tb2RlbC5zeW5jU3RhdHVzKClcbiAgICAgICAgcHJldkRhdGUgPSBEYXRlLm5vdygpXG4gICAgfVxuXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSggY3ljbGUgKVxufSkoKVxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBoYXNDbGFzcyA6IGZ1bmN0aW9uKCBlbCAsIGMgKXtcclxuXHRcdHJldHVybiBlbC5jbGFzc0xpc3QuY29udGFpbnMoYylcclxuXHR9LFxyXG5cdGFkZENsYXNzIDogZnVuY3Rpb24oIGVsICwgYyApe1xyXG5cdFx0ZWwuY2xhc3NOYW1lICs9ICcgJytjXHJcblx0fSxcclxuXHRyZW1vdmVDbGFzcyA6IGZ1bmN0aW9uKCBlbCAsIGMgKXtcclxuXHRcdHZhciBuYz1cIlwiXHJcblx0XHRmb3IodmFyIGk9ZWwuY2xhc3NMaXN0Lmxlbmd0aDtpLS07IClcclxuXHRcdFx0aWYoIGMgIT0gZWwuY2xhc3NMaXN0W2ldIClcclxuXHRcdFx0XHRuYyArPSAnICcrZWwuY2xhc3NMaXN0W2ldXHJcblx0XHRlbC5jbGFzc05hbWUgPSBuY1xyXG5cdH0sXHJcblx0Z2V0UGFyZW50IDogZnVuY3Rpb24oIGVsICwgYyApe1xyXG5cdFx0d2hpbGUodHJ1ZSlcclxuXHRcdFx0aWYoIGVsICYmICF0aGlzLmhhc0NsYXNzKCBlbCAsIGMgKSApXHJcblx0XHRcdFx0ZWwgPSBlbC5wYXJlbnRFbGVtZW50XHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdHJldHVybiBlbFxyXG5cdH0sXHJcblx0YmluZCA6IGZ1bmN0aW9uKCBlbCAsIGV2ZW50TmFtZSAsIGZuICl7XHJcblxyXG5cdFx0dmFyIGwgPSBldmVudE5hbWUuc3BsaXQoJyAnKVxyXG5cdFx0aWYoIGwubGVuZ3RoPjEgKXtcclxuXHRcdFx0Zm9yKHZhciBpPWwubGVuZ3RoO2ktLTspXHJcblx0XHRcdFx0dGhpcy5iaW5kKCBlbCAsIGxbaV0gLCBmbiApXHJcblx0XHRcdHJldHVyblxyXG5cdFx0fVxyXG5cclxuXHJcblx0XHRlbC5fYmluZEhhbmRsZXJzID0gZWwuX2JpbmRIYW5kbGVycyB8fCB7fVxyXG5cclxuXHRcdHRoaXMudW5iaW5kKCBlbCAsIGV2ZW50TmFtZSApXHJcblxyXG5cdFx0ZWwuYWRkRXZlbnRMaXN0ZW5lciggZXZlbnROYW1lLnNwbGl0KCcuJylbMF0gLCBmbiAsIGZhbHNlIClcclxuXHRcdGVsLl9iaW5kSGFuZGxlcnNbIGV2ZW50TmFtZSBdID0gZm5cclxuXHR9LFxyXG5cdHVuYmluZCA6IGZ1bmN0aW9uKCBlbCAsIGV2ZW50TmFtZSApe1xyXG5cclxuXHRcdHZhciBsID0gZXZlbnROYW1lLnNwbGl0KCcgJylcclxuXHRcdGlmKCBsLmxlbmd0aD4xICl7XHJcblx0XHRcdGZvcih2YXIgaT1sLmxlbmd0aDtpLS07KVxyXG5cdFx0XHRcdHRoaXMudW5iaW5kKCBlbCAsIGxbaV0gKVxyXG5cdFx0XHRyZXR1cm5cclxuXHRcdH1cclxuXHJcblx0XHRpZiggIWVsLl9iaW5kSGFuZGxlcnMgfHwgIWVsLl9iaW5kSGFuZGxlcnNbIGV2ZW50TmFtZSBdIClcclxuXHRcdFx0cmV0dXJuXHJcblxyXG5cdFx0ZWwucmVtb3ZlRXZlbnRMaXN0ZW5lciggZXZlbnROYW1lLnNwbGl0KCcuJylbMF0gLCBlbC5fYmluZEhhbmRsZXJzWyBldmVudE5hbWUgXSAsIGZhbHNlIClcclxuXHRcdGVsLl9iaW5kSGFuZGxlcnNbIGV2ZW50TmFtZSBdID0gbnVsbFxyXG5cdH0sXHJcbiAgICBkb21pZnkgOiAoZnVuY3Rpb24oKXtcclxuICAgICAgICBpZiggdHlwZW9mIGRvY3VtZW50ICE9ICdvYmplY3QnIClcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCl7fVxyXG4gICAgICAgIHZhciB0YW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oIHRwbCApe1xyXG4gICAgICAgICAgICB0YW5rLmlubmVySFRNTCA9IHRwbFxyXG4gICAgICAgICAgICB2YXIgZG9tRWwgPSB0YW5rLmNoaWxkcmVuWyAwIF1cclxuICAgICAgICAgICAgdGFuay5pbm5lckhUTUwgPSAnJ1xyXG4gICAgICAgICAgICByZXR1cm4gZG9tRWxcclxuICAgICAgICB9XHJcbiAgICB9KSgpXHJcbn1cclxuIiwiXHJcbnZhciBlbmNvZGVBdXRoID0gZnVuY3Rpb24oIGxvZ2luICwgcGFzc3dvcmQgKXtcclxuICAgIHJldHVybiAnQmFzaWMgJytidG9hKCBsb2dpbisnOicrcGFzc3dvcmQgKTtcclxufVxyXG5cclxuLypcclxuICogc2ltcGxlIGh4ciB3cmFwcGVyXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG52YXIgcmVxdWVzdCA9IGZ1bmN0aW9uKCB1cmwgLCBvcHRpb25zICl7XHJcblxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cclxuXHJcbiAgICBpZiggb3B0aW9ucy5sb2dpbiAmJiBvcHRpb25zLnBhc3N3b3JkIClcclxuICAgICAgICAoIG9wdGlvbnMuaGVhZGVycyA9IG9wdGlvbnMuaGVhZGVycyB8fCB7fSApWyAnQXV0aG9yaXphdGlvbicgXSA9IGVuY29kZUF1dGgoIG9wdGlvbnMubG9naW4gLCBvcHRpb25zLnBhc3N3b3JkIClcclxuXHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSxyZWplY3RlZCl7XHJcblxyXG4gICAgICAgIHZhciBzdWNjZXNzID0gZnVuY3Rpb24oIHJlcCApe1xyXG4gICAgICAgICAgICBpZiggcmVwLnRhcmdldC5zdGF0dXMgIT0gMjAwIHx8ICFyZXAudGFyZ2V0LnJlc3BvbnNlVGV4dC5sZW5ndGggIClcclxuICAgICAgICAgICAgICAgIHJldHVybiByZWplY3RlZCggcmVwLnRhcmdldCApXHJcblxyXG4gICAgICAgICAgICBpZiggcmVwLnRhcmdldC5zdGF0dXMgPT0gMjAwICApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZSggcmVwLnRhcmdldC5yZXNwb25zZVRleHQgKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGVycm9yICA9IGZ1bmN0aW9uKCByZXAgKXtcclxuICAgICAgICAgICAgcmVqZWN0ZWQoIHJlcCApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCh7bW96U3lzdGVtOiB0cnVlfSk7XHJcbiAgICAgICAgeGhyLm9wZW4oIG9wdGlvbnMudmVyYiB8fCAoIG9wdGlvbnMuZGF0YSA/ICdQT1NUJyA6ICdHRVQnICkgLCB1cmwgLCB0cnVlKTtcclxuXHJcbiAgICAgICAgLy8gY2FsbGJhY2tzXHJcbiAgICAgICAgeGhyLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgZXJyb3IgLCBmYWxzZSk7XHJcbiAgICAgICAgeGhyLmFkZEV2ZW50TGlzdGVuZXIoJ2Fib3J0JywgZXJyb3IgLCBmYWxzZSk7XHJcbiAgICAgICAgeGhyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBzdWNjZXNzICwgZmFsc2UpO1xyXG5cclxuICAgICAgICAvLyBoZWFkZXJzXHJcbiAgICAgICAgZm9yKCB2YXIga2V5IGluIG9wdGlvbnMuaGVhZGVycyB8fCB7fSApXHJcbiAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCBrZXkgLCBvcHRpb25zLmhlYWRlcnNbIGtleSBdIClcclxuXHJcbiAgICAgICAgLy8gc2VuZFxyXG4gICAgICAgIHhoci5zZW5kKCBvcHRpb25zLmRhdGEgKTtcclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5cclxuXHJcbnZhciBnZXQgPSBmdW5jdGlvbiggdXJsICwgb3B0aW9ucyApe1xyXG4gICAgKCBvcHRpb25zID0gb3B0aW9ucyB8fCB7fSApLnZlcmIgPSAnR0VUJ1xyXG4gICAgcmV0dXJuIHJlcXVlc3QoIHVybCAsIG9wdGlvbnMgKVxyXG59XHJcblxyXG52YXIgcHV0ID0gZnVuY3Rpb24oIHVybCAsIG9wdGlvbnMgKXtcclxuICAgICggb3B0aW9ucyA9IG9wdGlvbnMgfHwge30gKS52ZXJiID0gJ1BVVCdcclxuICAgIHJldHVybiByZXF1ZXN0KCB1cmwgLCBvcHRpb25zIClcclxufVxyXG5cclxudmFyIHBvc3QgPSBmdW5jdGlvbiggdXJsICwgb3B0aW9ucyApe1xyXG4gICAgKCBvcHRpb25zID0gb3B0aW9ucyB8fCB7fSApLnZlcmIgPSAnUFVUJ1xyXG4gICAgcmV0dXJuIHJlcXVlc3QoIHVybCAsIG9wdGlvbnMgKVxyXG59XHJcblxyXG52YXIgbW9ja1JlcXVlc3QgPSBmdW5jdGlvbiggdXJsICwgb3B0aW9ucyApe1xyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cclxuXHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSxyZWplY3RlZCl7XHJcbiAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgIHN3aXRjaCggb3B0aW9ucy52ZXJiICl7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnR0VUJyA6XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdCA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKGZha2VJbmRleClcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIH0gLCAoTWF0aC5yYW5kb20oKSoxMDAwKzEwMCk8PDAgKVxyXG4gICAgfSlcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgcHV0IDogcHV0LFxyXG4gICAgcG9zdCA6IHBvc3QsXHJcbiAgICBnZXQgOiBnZXQsXHJcblxyXG4gICAgcmVxdWVzdDpyZXF1ZXN0XHJcbiAgICAvL3JlcXVlc3Q6bW9ja1JlcXVlc3RcclxufVxyXG4iXX0=
