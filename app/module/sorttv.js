var exec = require('../util/exec')
  , Abstract = require('./abstract')

var init = function(){
    Abstract.init.call( this )
    this.status.scanning = false
}

var scan = function(){
    this.status.scanning = true
    this.dispatch('scan-start')

    return exec( 'sudo perl /home/pi/sortTV/sorttv.pl >> /var/log/gustave/sorttv.log' )
    .then(function(){
        this.status.scanning = false
        this.dispatch('scan-end')
    })
}

module.exports = Abstract.extend({
    init: init,
    scan: scan,
})
