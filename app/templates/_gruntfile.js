module.exports = function(grunt) {
    'use strict';
    require('load-grunt-tasks')(grunt);

    var pkg = require('./package.json');

    var dests = pkg.originBuild.dest;
    var srcs = pkg.originBuild.src;

    var cacheMap = [];

    grunt.initConfig({
        sass: {
            dev: {
                options: {
                    style: 'expanded',
                    precision: 10
                },
                files: [
                    {
                        expand: true,
                        cwd: srcs.scss,
                        src: ['styles.scss'],
                        dest: dests.css,
                        ext: '.css'
                    }
                ]
            },
            prod: {
                options: {
                    style: 'compressed',
                    sourcemap: 'none',
                    precision: 10
                },
                files: [{
                    expand: true,
                    cwd: srcs.scss,
                    src: ['styles.scss'],
                    dest: 'release/latest/public/static/css/',
                    ext: '.css'
                }]
            }
        },
        autoprefixer: {
            options: {
                browsers: [
                    'last 2 versions',
                    'ie 8',
                    'ie 9'
                ]
            },
            prod: {
                src: dests.css + '/styles.css'
            }
        },
        imagemin: {
            dev: {
                options: {

                },
                files: [{
                    expand: true,
                    cwd: srcs.img,
                    src: ['**/*.{png,jpg,gif}'],
                    dest: dests.img
                }]
            }
        },
        browserify: {
            dev: {
                src: srcs.js+'/main.js',
                dest: dests.js+'/bundle.js'
            },
            prod: {
                src: srcs.js+'/main.js',
                dest: 'release/latest/public/static/js/bundle.js'
            }
        },
        uglify: {
            options: {
                compress: {
                    drop_console: true
                }
            },
            prod: {
                files: {
                    'release/latest/public/static/js/bundle.js': ['public/static/js/bundle.js']
                }
            }
        },
        cssmin: {
            prod: {
                files: {
                    'release/latest/public/static/css/styles.min.css': ['public/static/css/styles.css']
                }
            }
        },
        copy: {
            fonts: {
                files: [
                    {
                        expand: true,
                        cwd: 'src',
                        src: 'fonts/**/*',
                        dest: 'public/static',
                        filter: 'isFile'
                    }
                ]
            },
            prod: {
                files: [
                    {
                        expand: true,
                        src: ['craft/**/*', 'public/static/**/*', 'public/**/*', '!public/uploads'],
                        dest: 'release/latest',
                        filter: 'isFile'
                    }
                ]
            }
        },
        compress: {
            release: {
                options: {
                    mode: 'tgz',
                    archive: './release/'+pkg.name+'-'+pkg.version+'.tar.gz'
                },
                files: [
                    {
                        expand: true,
                        cwd: 'release/latest',
                        src: ['**/*'],
                        dest: pkg.name
                    }
                ]
            }
        },
        bushcaster: {
            options: {
                hashLength: 8,
                noProcess: true,
                onComplete: function(map, files) {
                    files.forEach(function (file) {
                        cacheMap.push({
                            pattern: file,
                            replacement: map[file]
                        });
                    });
                }
            },
            prod: {
                files: [{
                    expand: true,
                    cwd: 'release/latest/public/',
                    src: ['static/css/styles.css', 'static/js/bundle.js'],
                    dest: '.'
                }]
            }
        },
        'string-replace': {
            prod: {
                files:[{
                    expand: true,
                    cwd: 'release/latest/craft/templates/common',
                    src: ['doc_head.twig', 'js.twig'],
                    dest: 'release/latest/craft/templates/common'
                }],
                options: {
                    replacements: cacheMap
                }
            }
        },
        clean: {
            prod: [
                'release/latest/public/static/css/styles.css',
                'release/latest/public/static/css/styles.css.map',
                'release/latest/public/static/js/bundle.js',
                'release/latest/craft/storage/runtime', //clean the runtime
                'release/latest/public/uploads'
            ],
            postprod: [
                'release/latest'
            ]
        },
        watch: {
            css: {
                files: dests.css+'/**/*.css',
                options: {
                    livereload: true
                }
            },
            scss: {
                files: srcs.scss+'/**/*.scss',
                tasks: ['sass:dev', 'autoprefixer:prod']
            },
            twig: {
                files: 'craft/templates/**/*.twig',
                options: {
                    livereload: true
                }
            },
            img: {
                files: srcs.img+'/**/*.{jpg,png.gif}',
                tasks: ['newer:imagemin:dev']
            },
            js: {
                files: srcs.js+'/**/*.js',
                tasks: ['browserify:dev']
            },
            jsCompiled: {
                files: dests.js+'/**/*.js',
                options: {
                    livereload: true
                }
            }
        }
    });

    grunt.registerTask('default', ['copy:fonts', 'sass:dev', 'autoprefixer:prod', 'imagemin:dev', 'browserify:dev', 'watch']);

    grunt.registerTask('release', [
        'copy:fonts',
        'copy:prod',
        'sass:prod',
        'autoprefixer:prod',
        'imagemin:dev',
        'browserify:prod',
        'uglify:prod',
        'bushcaster:prod',
        'string-replace:prod',
        'clean:prod',
        'compress:release'
    ]);
};
