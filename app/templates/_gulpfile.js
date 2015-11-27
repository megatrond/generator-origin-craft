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
var rev = require('gulp-rev');
var revReplace = require('gulp-rev-replace');
var vinylPaths = require('vinyl-paths');
var watch = require('gulp-watch');

// ######################################################
//          JAVASCRIPT BUILDING
// ######################################################

var supportedBrowsers = ['last 2 versions', 'IE 9'];

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
//          JAVASCRIPT BUILDING ENDED
// ######################################################

// ######################################################
//          SCSS/CSS BUILDING
// ######################################################

gulp.task('sass', function() {
    return gulp.src('./src/scss/styles.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: 'compressed'}))
        .pipe(autoprefixer({
            browsers: supportedBrowsers,
            cascade: false
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./public/static/css'))
        .pipe(browserSync.stream());
})

gulp.task('sass:watch', function() {
    watch('./src/scss/**/*.scss', () => {
        gulp.start('sass');
    });
});

// ######################################################
//          SCSS/CSS ENDED
// ######################################################


// ######################################################
//          BROWSERSYNC
// ######################################################

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
    watch('./src/scss/**/*.scss', () => {
        gulp.start('sass');
    });
    watch('./src/fonts/**/*', () => {
        gulp.start('copy');
    });
    watch('./src/img/**/*', () => {
        gulp.start('imagemin');
    });
    watch('./craft/templates/**/*.twig', () => {
        gulp.start('twig');
    });
});

// ######################################################
//          BROWSERSYNC END
// ######################################################

// ######################################################
//          COPY STATIC FILES
// ######################################################

gulp.task('copy', function() {
    gulp.src(['./src/fonts/**/*'])
        .pipe(gulp.dest('./public/static/fonts'))
        .pipe(browserSync.stream());
});

// ######################################################
//          COPY END
// ######################################################
gulp.task('twig', function() {
    gulp.src('./craft/templates/**/*.twig')
        .pipe(browserSync.stream());
});
// ######################################################
//          MINIFY IMAGES
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
});

// ######################################################
//          MINIFY IMAGES END
// ######################################################

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
// rev static files
gulp.task('revision:release', ['js:release', 'scss:release'], function() {
    var staticPath = 'release/latest/public/static/';
    var files = [
        staticPath + 'css/*.css',
        staticPath + 'js/*.js'
    ];
    return gulp.src(files, {base: '.'})
        .pipe(rev())
        .pipe(gulp.dest('.'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('.'));
});
gulp.task('clean:postbuild', ['revision:release'], function(cb) {
    var staticPath = 'release/latest/public/static/';
    var files = [
        staticPath + 'css/styles.css',
        staticPath + 'js/bundle.js'
    ];
    return del(files, cb);
});
gulp.task('revision:refchange', ['revision:release'], function() {
    var manifest = gulp.src('./rev-manifest.json');
    var commonPath = 'release/latest/craft/templates/common/';
    function replacePrefixPath(filename) {
        return filename.replace('release/latest/public/', '{{ siteUrl }}');
    }
    return gulp.src([commonPath + 'js.twig', commonPath + 'doc_head.twig'])
        .pipe(revReplace({
            manifest: manifest,
            modifyUnreved: replacePrefixPath,
            modifyReved: replacePrefixPath,
            replaceInExtensions: ['.twig']
        }))
        .pipe(gulp.dest(commonPath));
});
// bump version number
gulp.task('bump:release', function() {
    return gulp.src('package.json')
        .pipe(bump())
        .pipe(gulp.dest('./'));
});
gulp.task('svn:tag', ['bump:release'], function() {
    var version = require('./package.json').version;
    return svn.tag('v'+version, 'Release '+version, function(err) {
        if (err) throw err;
    });
});
// compress into tarball
gulp.task('compress:build', [
    'clean:release',
    'copy:release',
    'js:release',
    'scss:release',
    'revision:release',
    'revision:refchange',
    'clean:postbuild'
], function() {
    var pkg = require('./package.json');
    var version = pkg.version;
    var appname = pkg.name;
    return gulp.src('release/latest/**/*', {base: './release/latest'})
        .pipe(tar(appname+'-'+version+'.tar'))
        .pipe(gzip())
        .pipe(gulp.dest('release'));
});
// compress into tarball, with added dependency on the 'bump:release' task
gulp.task('compress:release', [
    'clean:release',
    'copy:release',
    'js:release',
    'scss:release',
    'revision:release',
    'revision:refchange',
    'clean:postbuild',
    'bump:release'
], function() {
    var pkg = require('./package.json');
    var version = pkg.version;
    var appname = pkg.name;
    return gulp.src('release/latest/**/*', {base: './release/latest'})
        .pipe(tar(appname+'-'+version+'.tar'))
        .pipe(gzip())
        .pipe(gulp.dest('release'));
});

gulp.task('default', ['js', 'serve']);

gulp.task('build', [
    'clean:release',
    'copy:release',
    'js:release',
    'scss:release',
    'revision:release',
    'revision:refchange',
    'clean:postbuild',
    'compress:build'
]);

gulp.task('release', [
    'clean:release',
    'copy:release',
    'js:release',
    'scss:release',
    'revision:release',
    'revision:refchange',
    'clean:postbuild',
    'bump:release',
    'svn:tag',
    'compress:release'
]);
