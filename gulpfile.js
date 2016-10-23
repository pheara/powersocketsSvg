'use strict';

var gulp = require('gulp');
var gulp_jspm = require('gulp-jspm');
var sourcemaps = require('gulp-sourcemaps');
var ts = require("gulp-typescript");

gulp.task('default', ['build']);
gulp.task('build', ['bundlejs']);
gulp.task('watch', ['bundlejs'], function() {
    gulp.watch('./app/**/*', ['bundlejs']);
});

gulp.task('bundlejs', function(){
    return gulp.src('app/**/*.ts')
        .pipe(sourcemaps.init())
        .pipe(ts({
          out: 'bundle.js',
          module: 'system',
          target: 'es6'
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./generated/'));
});
