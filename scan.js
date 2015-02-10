var sorttv = require('./sorttv')

var init = function( kodi ){
    this.kodi = kodi

    this.status.scanState = 'idle'

    return this
}

var timeStamp = function( d ){
    d = new Date( d || Date.now() )
    return d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()+' '+d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear()
}

var scan = function(){

    console.log('---   scan '+timeStamp())
    console.log('---     sorttv start')

    var that = this
    this.status.scanState = 'sorttv'

    return sorttv.crawl()
    .then(
        function(r){
            console.log('---     sorttv ended '+timeStamp())
        },
        function(err){
            that.status.scanState = 'sorttv fail'
            console.log('---     sorttv failed '+timeStamp())
            console.log( err )
        }
    )
    .then(function(){
        console.log('---     kodi scan start '+timeStamp())
        that.status.scanState = 'kodi-scan'
    })
    .then( that.kodi.scan() )
    .then(
        function(r){
            console.log('---     kodi scan started '+timeStamp())
        },
        function(err){
            that.status.scanState = 'kodi-scan fail'
            console.log('---     kodi scan failed '+timeStamp())
            console.log( err )
        }
    )
}

module.exports = {
    init: init,
    scan: scan
}
