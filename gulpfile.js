var JS_PATH = './scripts/**/*.js';
var JS_MODULES_PATH = './scripts/modules/**/*.js';
var DEST_PATH = 'dest';

var VENDOR_SETTING_PATH = './vendor.json';
var VENDOR_FILE_BASE_PATH = './node_modules';


var fs = require('fs-extra');
// var path = require('path');


// npm module
var gulp = require('gulp');
var plugin = require('gulp-load-plugins')();
var browserSync = require('browser-sync');
//var del = require('del');
var runSequence = require('run-sequence');



// ターミナルで gulp help とすると gulpfile.js で定義されたタスク一覧が表示される
plugin.help(gulp);



gulp.task('jshint', 'Run jshint', function() {
  return gulp.src([JS_PATH,'!'+JS_MODULES_PATH])
    .pipe(plugin.jshint())
    .pipe(plugin.jshint.reporter('jshint-stylish'))
    .pipe(plugin.jshint.reporter('fail'));
});

gulp.task('scripts:lib', 'Compile JavaScript lib files', function(cb) {
  var src = gulp.src(getLibPath('src'))
    .pipe(plugin.using())
    .pipe(plugin.concat('lib.js'))
    .pipe(gulp.dest(DEST_PATH + '/scripts'));

  var min = gulp.src(getLibPath('min'))
    .pipe(plugin.concat('lib.min.js'))
    .pipe(gulp.dest(DEST_PATH + '/scripts'));

  cb();
});

gulp.task('scripts:modules', 'Compile JavaScript modules', function(cb) {
  return gulp.src(JS_MODULES_PATH)
    .pipe(plugin.using())
    .pipe(plugin.concat('modules.js'))
    .pipe(gulp.dest(DEST_PATH + '/scripts'));
});

gulp.task('scripts:app', 'Compile JavaScript app', function(cb) {
  return gulp.src([JS_PATH,'!'+JS_MODULES_PATH])
    .pipe(plugin.using())
    .pipe(gulp.dest(DEST_PATH + '/scripts'));
});

gulp.task('scripts', 'Compile JavaScript all files', ['scripts:lib', 'scripts:modules', 'scripts:app']);






gulp.task('clean', 'Clean files', function(cb) {
//  del(DEST_PATH, { force: true });
  fs.removeSync(DEST_PATH);


  cb();
});

gulp.task('browser-sync', 'Run browser-sync', function(cb) {
  browserSync({
    server: {
        baseDir: './'
    }
  });
  cb();
});

gulp.task('build', 'Build all assets', function(cb) {
  runSequence('clean', 'scripts', cb);
});

gulp.task('watch', function(cb) {
  runSequence('build', 'browser-sync', cb);
  gulp.watch(JS_PATH, ['scripts', browserSync.reload]);
  gulp.watch('./*.html', browserSync.reload);
});


// JSのライブラリ関連のパスを取得
function getLibPath(type) {
  return JSON.parse(fs.readFileSync(VENDOR_SETTING_PATH)).paths.map(function(_path) {
    var path = VENDOR_FILE_BASE_PATH + '/' + _path[type];
    var exists = fs.existsSync(__dirname + '/' + path);
    if (!exists) {
      logError(path + ' is not found.');
      process.exit(1);
    }
    return path;
  });
}


function logSuccess(msg) {
  plugin.util.log(plugin.util.colors.green(msg));
}

function logError(msg) {
  plugin.util.log(plugin.util.colors.red(msg));
}







