var ee = require('Events').EventEmitter
  , Abstract = require('../util/abstract')

var init = function(){
    ee.call( this )
    return this
}



var A = Object.create( Abstract )
.extend({
    init: init
})
.extend(ee)

for(var i in ee.prototype )
    A[ i ] = ee.prototype[ i ]


module.exports = A
