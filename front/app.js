var dom = require('./domHelper')
  , TransmissionModel = require('./TransmissionModel')
  , transport = require('./transport')

var tr_model = Object.create( TransmissionModel ).syncStatus()


var bigNumber = (function(){
    var r = [ '', 'K', 'M', 'T', 'P' ]
    var base = 1000
    var ndec = 2
    return function( x ){
        var e = x
        for( var k=0; e > 800; e /= base )
            k++

        var dec = (e%1)+''
        while( dec.length < ndec )
            dec+='0'

        return (0|e)+'.'+dec+r[k]
    }
})()


var button = document.querySelector('.switch')
var explaination = document.querySelector('.explaination')
var metrics = document.querySelector('.metrics')
var scanNow = document.querySelector('.scan-now')
var scanState = document.querySelector('.scan-state')

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

scanNow.addEventListener('click',function(){
    transport.get('/kodi/scan')
})
tr_model.listen(function(){
    metrics.innerHTML = 'speed: '+bigNumber(tr_model.status.global_up)+'B/s up   -   '+bigNumber(tr_model.status.global_down)+'B/s down'
})
tr_model.listen(function(){
    scanState.innerHTML = tr_model.status.scanState
})




var prevDate = 0
;(function cycle(){

    if( Date.now() - prevDate > 2000 ){
        tr_model.syncStatus()
        prevDate = Date.now()
    }

    window.requestAnimationFrame( cycle )
})()
