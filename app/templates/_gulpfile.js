'use strict';

var watchify = require('watchify');
var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var assign = require('lodash.assign');
var babelify = require('babelify');
var uglify = require('gulp-uglify');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var CacheBuster = require('gulp-cachebust');
var cachebust = new CacheBuster();


// ######################################################
// 			JAVASCRIPT BUILDING
// ######################################################

// add custom browserify options here
var customOpts = {
  entries: ['./src/js/main.js'],
  debug: true
};
var opts = assign({}, watchify.args, customOpts);
var b = watchify(browserify(opts)); 

// add transformations here
// i.e. b.transform(coffeeify);
b.transform(babelify);

gulp.task('js', bundle); // so you can run `gulp js` to build the file
b.on('update', bundle); // on any dep update, runs the bundler
b.on('log', gutil.log); // output build logs to terminal

function bundle() {
  return b.bundle()
    // log errors if they happen
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('bundle.js'))
    // optional, remove if you don't need to buffer file contents
    .pipe(buffer())
    // optional, remove if you dont want sourcemaps
    .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
       // Add transformation tasks to the pipeline here.
       .pipe(uglify())
       .on('error', gutil.log)
    .pipe(sourcemaps.write('./')) // writes .map file
    .pipe(gulp.dest('./public/static/js'))
    .pipe(browserSync.stream());
}

// ######################################################
// 			JAVASCRIPT BUILDING ENDED
// ######################################################

// ######################################################
// 			SCSS/CSS BUILDING
// ######################################################

gulp.task('sass', function() {
	return gulp.src('./src/scss/styles.scss')
		.pipe(sourcemaps.init())
		.pipe(sass({outputStyle: 'compressed'}))
		.pipe(autoprefixer({
			browsers: ['last 2 versions'],
			cascade: false
		}))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('./public/static/css'))
		.pipe(browserSync.stream());
})

gulp.task('sass:watch', function() {
	gulp.watch('./src/scss/**/*.scss', ['sass']);
});

// ######################################################
// 			SCSS/CSS ENDED
// ######################################################


// ######################################################
// 			BROWSERSYNC
// ######################################################

gulp.task('serve', ['sass', 'copy', 'imagemin'], function() {
	browserSync.init({
		proxy: {
			target: 'http://local.gulp-test.no:8888'
		},
		reqHeaders: function(config) {
			return {
				"host": config.urlObj.host
			}
		}
		
	});
	gulp.watch('./src/scss/**/*.scss', ['sass']);
	gulp.watch('./src/fonts/**/*', ['copy']);
	gulp.watch('./src/img/**/*', ['imagemin']);
	gulp.watch('./craft/templates/**/*.twig', ['twig']);
});

gulp.task('default', ['js', 'serve']);
// ######################################################
// 			BROWSERSYNC END
// ######################################################

// ######################################################
// 			COPY STATIC FILES
// ######################################################

gulp.task('copy', function() {
	gulp.src(['./src/fonts/**/*'])
		.pipe(gulp.dest('./public/static/fonts'))
		.pipe(browserSync.stream());
});

// ######################################################
// 			COPY END
// ######################################################
gulp.task('twig', function() {
	gulp.src('./craft/templates/**/*.twig')
		.pipe(browserSync.stream());
});
// ######################################################
// 			MINIFY IMAGES
// ######################################################

gulp.task('imagemin', function() {
	gulp.src('./src/img/**/*')
		.pipe(imagemin({
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()]
		}))
		.pipe(gulp.dest('./public/static/img'))
		.pipe(browserSync.stream());
})

// ######################################################
// 			MINIFY IMAGES END
// ######################################################