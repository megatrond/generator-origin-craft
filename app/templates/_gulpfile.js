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

var del = require('del');
var tar = require('gulp-tar');
var gzip = require('gulp-gzip');
var bump = require('gulp-bump');
var svn = require('gulp-svn');

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

// js bundling task
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
};

// build css from sass (development)
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
// watch sass files (not used?)
gulp.task('sass:watch', function() {
	gulp.watch('./src/scss/**/*.scss', ['sass']);
});

// browsersync 
gulp.task('serve', ['sass', 'copy', 'imagemin'], function() {
	browserSync.init({
		proxy: {
			target: 'http://local.<%= appName %>.no:8888'
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

// copy static assets
gulp.task('copy', function() {
	gulp.src(['./src/fonts/**/*'])
		.pipe(gulp.dest('./public/static/fonts'))
		.pipe(browserSync.stream());
});

// copy twig templates
gulp.task('twig', function() {
	gulp.src('./craft/templates/**/*.twig')
		.pipe(browserSync.stream());
});

// minify images
gulp.task('imagemin', function() {
	gulp.src('./src/img/**/*')
		.pipe(imagemin({
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()]
		}))
		.pipe(gulp.dest('./public/static/img'))
		.pipe(browserSync.stream());
});

// cleanup
gulp.task('clean:release', function(cb) {
    return del(['release/latest'], cb)
});
// copy files to prepare for relase
gulp.task('copy:release', ['clean:release'], function() {
    return gulp.src(['craft/**/*', 'public/*', '!public/uploads', '!public/static'], {base: '.', dot: true})
        .pipe(gulp.dest('release/latest'));
});
// build javascript
gulp.task('js:release', ['copy:release'], function() {
    return browserify({entries: ['./src/js/main.js']})
        .transform(babelify)
        .bundle()
        .on('error', gutil.log.bind(gutil, 'Browserify Error'))
        .pipe(source('bundle.js'))
        // optional, remove if you don't need to buffer file contents
        .pipe(buffer())
        .pipe(uglify())
        .on('error', gutil.log)
        .pipe(gulp.dest('./release/latest/public/static/js'));
});
// build styles
gulp.task('scss:release', ['copy:release'], function() {
    return gulp.src('./src/scss/styles.scss')
        .pipe(sass({outputStyle: 'compressed'}))
        .pipe(autoprefixer({
            browsers: supportedBrowsers,
            cascade: false
        }))
        .pipe(gulp.dest('./release/latest/public/static/css'));
});
// bump version number
gulp.task('bump:release', function() {
    return gulp.src('package.json')
        .pipe(bump())
        .pipe(gulp.dest('./'));
});
// tag the release
gulp.task('svn:tag', ['compress:release', 'bump:release'], function() {
    var version = require('./package.json').version;
    return svn.tag('v'+version, 'Release '+version, function(err) {
        if (err) {
        	throw err;
        }
    });
});
// commit the updated package.json
gulp.task('svn:commit', ['svn:tag'], function() {
	return svn.commit('[gulp build system] Version bump', function(err) {
		if (err) {
			throw err;
		}
	})
});
// compress into tarball
gulp.task('compress:release', ['clean:release', 'copy:release', 'js:release', 'scss:release'], function() {
    var pkg = require('./package.json');
    var version = pkg.version;
    var appname = pkg.name;
    return gulp.src('release/latest/**/*', {base: './release/latest'})
        .pipe(tar(appname+'-'+version+'.tar'))
        .pipe(gzip())
        .pipe(gulp.dest('release'));
});

// default development task. Use 'gulp' to run
gulp.task('default', ['js', 'serve']);

// builds current working copy into a tarball. neither bumps version nor commits tag
gulp.task('build', ['clean:release', 'copy:release', 'js:release', 'scss:release', 'compress:release']);

// creates a release. Use 'gulp release' to run
gulp.task('release', ['clean:release', 'copy:release', 'js:release', 'scss:release', 'compress:release', 'bump:release', 'svn:tag', 'svn:commit']);


