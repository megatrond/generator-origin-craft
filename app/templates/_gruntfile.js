module.exports = function(grunt) {
    'use strict';
    require('load-grunt-tasks')(grunt);

    var pkg = require('./package.json');

    var dests = pkg.originBuild.dest;
    var srcs = pkg.originBuild.src;

    grunt.initConfig({
        sass: {
            dev: {
                options: {
                    style: 'expanded'
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
            }
        },
        copy: {
            dev: {
                files: [
                    {
                        expand: true,
                        cwd: 'src',
                        src: 'fonts/**/*',
                        dest: 'public/static',
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
                        src: ['craft/**/*', 'public/static/**/*', 'public/*', '!public/uploads'],
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
                    console.log(cacheMap);
                }
            },
            prod: {
                files: [{
                    expand: true,
                    cwd: 'public/',
                    src: ['static/css/styles.css', 'static/js/bundle.js'],
                    dest: '.'
                }]
            }
        },
        'string-replace': {
            prod: {
                files:[{
                    expand: true,
                    cwd: 'craft/templates/common',
                    src: ['doc_head.twig', 'js.twig'],
                    dest: 'craft/templates/common'
                }],
                options: {
                    replacements: cacheMap
                }
            }
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
                tasks: ['sass:dev']
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

    grunt.registerTask('default', ['copy:dev', 'sass:dev', 'imagemin:dev', 'browserify:dev', 'watch']);

    grunt.registerTask('release', ['copy:dev', 'sass:prod', 'imagemin:dev', 'browserify:dev', 'uglify:prod', 'compress:release']);
};