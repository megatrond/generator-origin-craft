'use strict';
var util = require('util');
var path = require('path');
var fs = require('fs');
var yeoman = require('yeoman-generator');
var yosay = require('yosay');

var craftUrl = 'http://buildwithcraft.com/latest.zip?accept_license=yes';

var OriginCraftGenerator = yeoman.generators.Base.extend({
    initializing: function () {
        this.pkg = require('../package.json');
    },

    prompting: function () {
        var done = this.async();

        // Have Yeoman greet the user.
        this.log(yosay(
            'Welcome to the terrific OriginCraft generator!'
            ));

        var prompts = [{
            name: 'appName',
            message: 'What is the name of the Craft app?'
        }];

        this.prompt(prompts, function (props) {
            this.appName = props.appName;

            done();
        }.bind(this));
    },
    downloadCraft: function() {
        var done = this.async();
        // download and extract Craft (URL and version specified above)
        this.extract(craftUrl, '.', function(error) {
            if (error) {
                console.log(error);
            } else {
                console.log('extracted');
                done();
            }
        });
    },
    setCraftConfig: function() {
        var done = this.async();
        var configPath = 'craft/config';
        var context = {
            appName: this.appName
        };
        var self = this;

        fs.unlink(configPath+'/general.php', function(err) {
            if (err) {
                console.log('Could not delete default config file: ' + err);
            } else {
                fs.unlink(configPath+'/db.php', function(err) {
                    if (err) {
                        console.log('Could not delete default db config file: ' + err);
                    } else {
                        self.template('craftConfig/_general.php', configPath+'/general.php', context);
                        self.template('craftConfig/_db.php', configPath+'/db.php', context);
                        done();
                    }
                })
            }
        });
    },
    removeDefaultTemplates: function() {
        var done = this.async();

        var deleteFolderRecursive = function(path) {
            if( fs.existsSync(path) ) {
                fs.readdirSync(path).forEach(function(file,index) {
                    var curPath = path + "/" + file;
                    if(fs.statSync(curPath).isDirectory()) {
                        deleteFolderRecursive(curPath);
                    } else { 
                        fs.unlinkSync(curPath);
                    }
                });
                fs.rmdirSync(path);
            }
        };

        deleteFolderRecursive('craft/templates');
        done();
    },
    writing: {
        app: function () {
            this.dest.mkdir('src');
            this.dest.mkdir('src/scss');
            this.dest.mkdir('src/fonts');
            this.dest.mkdir('src/img');
            this.dest.mkdir('src/js');

            var context = {
                appName: this.appName
            };
            this.template('_package.json', 'package.json', context);

            // copy main style and javascript files
            this.src.copy('scss/_styles.scss', 'src/scss/styles.scss');
            this.src.copy('js/_main.js', 'src/js/main.js');

            var templatePath = 'craft/templates/common';
            this.dest.mkdir('craft/templates');
            this.dest.mkdir(templatePath);
            this.dest.mkdir('craft/storage');
            this.dest.mkdir('craft/plugins');
            this.src.copy('html/_doc_head.twig', templatePath+'/doc_head.twig');
            this.src.copy('html/_js.twig', templatePath+'/js.twig');
            this.src.copy('html/_page_footer.twig', templatePath+'/page_footer.twig');
            this.src.copy('html/_page_header.twig', templatePath+'/page_header.twig');
            this.src.copy('html/_layout.twig', templatePath+'/../_layout.twig');
            this.src.copy('html/_404.twig', templatePath+'/../404.twig');
            this.src.copy('html/_index.twig', templatePath+'/../index.twig');

            // copy configuration and grunt
            this.src.copy('_bower.json', 'bower.json');
            this.src.copy('_gruntfile.js', 'gruntfile.js');


        }
    },
    installdeps: function() {
        this.installDependencies();
    },
    end: function () {
        this.log('Remember to create a local database for the project.\nThe generated config files expects a database named \''+this.appName+'\', running on localhost\n');
        this.log('Craft expects you to have a virtualhost with \'local.\' in the name when developing.\n');
        this.log('Directory \'node_modules\' should be ignored in version control.\n')
    }
});

module.exports = OriginCraftGenerator;
