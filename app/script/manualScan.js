var Abstract = require('../util/abstract')
  , wait = require('../util/waitEvent')
  , trueOrWait = require('../util/trueOrWait')
  , input = require('../util/inputEvent')

var init = function( mods ){
    this.mods = mods
    return this
}

var enable = function( ){

    this.disable()

    var server = this.mods.server
    var kodi = this.mods.kodi
    var sorttv = this.mods.sorttv

    this._chain = input( server, 'ask-scan' )

    .then( trueOrWait(function(){ return !sorttv.status.scanning }, sorttv, 'scan-end' ) )
    .then( sorttv.scan.bind( sorttv ) )

    .then( trueOrWait(function(){ return !kodi.status.scanning }, kodi, 'scan-end' ) )
    .then( kodi.scan.bind( kodi ) )

}
var disable = function( ){
    if( this._chain )
        this._chain.kill()
}

module.exports = Object.create( Abstract )
.extend({
    init: init,
    enable: enable,
    disable: disable,
})
