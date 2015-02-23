var Abstract = require('./abstract')

var init = function( config ){
    Abstract.init.call( this )
    this._pause_delay = config.pause_delay
    this._dateResume
    this.status = {
        paused : false,
    }
    return this
}

var unpause = function(){
    if( !this.status.paused )
        return

    this.status.paused = false

    this.emit('unpause')
    clearTimeout( this._timeout )
}
var pause = function(){

    var paused = this.status.paused

    this.status.paused = true
    this.status.resume_date = Date.now() + this._pause_delay

    if( !paused )
        this.emit('pause')
    else
        clearTimeout( this._timeout )

    this._timeout = setTimeout( unpause.bind( this ), this._pause_delay )

}
var updateStatus = function(){
    this.status.resume_in = this.status.paused ? ( this.status.resume_date - Date.now() ) : 0
    return this.status
}

module.exports = Object.create( Abstract )
.extend({
    init: init,
    pause: pause,
    updateStatus: updateStatus
})
