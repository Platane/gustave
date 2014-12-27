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
