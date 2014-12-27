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
