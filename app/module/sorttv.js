var exec = require('../util/exec')
  , Abstract = require('./abstract')

var init = function(){
    Abstract.init.call( this )
    this.status = {
        scanning : false
    }
    return this
}

var scan = function(){
    this.status.scanning = true
    this.emit('scan-start')

    return exec( 'sudo perl /home/pi/sortTV/sorttv.pl >> /var/log/gustave/sorttv.log' )
    .then(function(){
        this.status.scanning = false
        this.emit('scan-end')
    }.bind(this))
}

module.exports = Object.create( Abstract )
.extend({
    init: init,
    scan: scan,
})
