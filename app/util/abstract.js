module.exports = {
    init:function(){ return this},
    extend:function(o){
        for(var i in o ){
            this[i] = o[i]
        }
        return this
    },
    ne:function(){
        return Object.create( this ).init.apply( this, arguments )
    }
}
