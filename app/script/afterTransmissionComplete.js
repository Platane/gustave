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

    var transmission = this.mods.transmission
    var kodi = this.mods.kodi
    var sorttv = this.mods.sorttv

    this._chain = input( transmission, 'download-finished' )

    .then( trueOrWait(function(){ return !sorttv.status.scaning }, sorttv, 'scan-end' ) )
    .then( sorttv.scan )

    .then( trueOrWait(function(){ return !kodi.status.scaning }, kodi, 'scan-end' ) )
    .then( kodi.scan )

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
