'use strict';

var gulp = require('gulp');
//var sass = require('gulp-sass');
//var minifyCss = require('gulp-minify-css');
//var rename = require('gulp-rename');
//var autoprefixer = require('gulp-autoprefixer');
//var svgSprite = require('gulp-svg-sprite');
//var sassImportOnce = require('node-sass-import-once');
var gulp_jspm = require('gulp-jspm');
var sourcemaps = require('gulp-sourcemaps');


gulp.task('default', ['build']);
gulp.task('build', ['bundlejs']);
gulp.task('watch', ['bundlejs'], function() {
    gulp.watch('./app/**/*.js', ['bundlejs']);
    //gulp.watch('./style/**/*.scss', ['sass']);
    //gulp.watch('./style/**/_*.scss', ['sass']);
    //gulp.watch('./images/won-icons/**/*.svg', ['iconsprite']);
});

gulp.task('bundlejs', function(){
    return gulp.src('app/app_jspm.js')
        .pipe(sourcemaps.init())
        .pipe(gulp_jspm({inject: true}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./generated/'));
});
