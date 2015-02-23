var gulp = require('gulp')
  , exec = require('child_process').exec
  , watch = require('gulp-watch')
  , rename = require('gulp-rename')
  , browserify = require('gulp-browserify')
  , autoprefixer = require('gulp-autoprefixer')
  , less =require('less')
  , Stream = require('stream').Stream
  , child_process = require('child_process')
  , Promise = require('promise')
  , fs = require('fs')


var exec = function( cmd ){
  return new Promise( function(resolve, reject){
      child_process.exec( cmd, function(err, out, code){
          if( err )
              reject({
                  err: err,
                  code: code,
                  cmd: cmd
              })
          resolve( out )
      })
  })
}


var host = 'pi@192.168.1.5'

gulp.task('copy.front', function () {
    return exec('scp ./front/bundle.js '+host+':~/gustave/front/bundle.js')
    .then( exec('scp ./front/bundle.css '+host+':~/gustave/front/bundle.css') )
    .then( exec('scp ./front/index.html '+host+':~/gustave/front/index.html') )
    .then( exec('scp ./package.json '+host+':~/gustave/package.json') )
    .then( exec('scp ./config.json '+host+':~/gustave/config.json') )
})
gulp.task('copy.app', function () {
    return exec('scp -r ./app '+host+':~/gustave/')
})
gulp.task('copy.config', function () {
    return exec('scp ./package.json '+host+':~/gustave/package.json')
    .then( exec('scp ./config.json '+host+':~/gustave/config.json') )
})
gulp.task('copy', ['copy.app', 'copy.config', 'copy.front' ] )

gulp.task('browserify', function () {
    exec(
        'node ./node_modules/browserify/bin/cmd.js ./front/app.js -o ./front/bundle.js --debug ' ,
        function( err , out , code ){
            if(err)
                console.log( err )
        }
    )
});

gulp.task('less', function () {

    var lessify = function(options){
        options = options || {}

        var stream = new Stream();
        stream.writable = stream.readable = true
        var pending = 0,closed=false;
        stream.write = function( file ){

            options.fileName = file.path

            pending++
            less.render(
                file.contents.toString('utf8'),
                options,
                function (e, css) {
                    if(e)
                        console.log(file.path+'\nline:'+e.line+': '+e.extract[2]+'\n'+e.message)

                    var f = file.path.split('.')
                    f[f.length-1] = 'css'

                    file.path = f.join('.')
                    file.contents = new Buffer(css.css||'')
                    stream.emit('data',file)
                    pending--
                    stream.end()
                }
            );
        }
        stream.destroy = function(){ this.emit('close') };
        stream.end = function(){
            if(closed||pending)
                return
            this.emit('end')
            closed = true
        }
        return stream
    }

    return gulp.src( './front/app.less' )
    .pipe( lessify({
        compress: false,
        paths: ['./css'],
    }))
    .pipe(autoprefixer({
        cascade: true,
        browsers: ['last 2 versions'],
    }))
    .pipe(rename('bundle.css'))
    .pipe(gulp.dest('./front/'))
});


gulp.task('watch', function () {

    gulp.watch( ['./app/**/*.js'] , ['copy.app'] )

	gulp.watch( ['./front/**/*.less'] , ['less', 'copy.front'] )

	gulp.watch( ['./front/**/*.js', '!./front/bundle.js'] , ['browserify', 'copy.front'] )

});

gulp.task('build', [ 'browserify' , 'less'] );

gulp.task('default', [ 'browserify' , 'less' , 'copy' , 'watch' ]);
