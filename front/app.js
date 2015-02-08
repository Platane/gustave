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
