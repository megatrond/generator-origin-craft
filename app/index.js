'use strict';
var util = require('util');
var path = require('path');
var fs = require('fs');
var generators = require('yeoman-generator');
var yosay = require('yosay');

var craftUrl = 'http://buildwithcraft.com/latest.zip?accept_license=yes';

var OriginCraftGenerator = generators.Base.extend({
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
                        self.fs.copyTpl(self.templatePath('craftConfig/_general.php'), self.destinationPath(configPath+'/general.php'), context);
                        self.fs.copyTpl(self.templatePath('craftConfig/_db.php'), self.destinationPath(configPath+'/db.php'), context);
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
            // this.fs.mkdir(this.destinationPath('src'));
            // this.fs.mkdir(this.destinationPath('src/scss'));
            // this.fs.mkdir(this.destinationPath('src/fonts'));
            // this.fs.mkdir(this.destinationPath('src/img'));
            // this.fs.mkdir(this.destinationPath('src/js'));

            var context = {
                appName: this.appName
            };
            this.fs.copyTpl(this.templatePath('_package.json'), this.destinationPath('package.json'), context);

            // copy main style and javascript files
            this.fs.copy(this.templatePath('scss/_styles.scss'), this.destinationPath('src/scss/styles.scss'));
            this.fs.copy(this.templatePath('js/_main.js'), this.destinationPath('src/js/main.js'));

            var templatePath = 'craft/templates/common';
            // this.dest.mkdir('craft/templates');
            // this.dest.mkdir(templatePath);
            // this.dest.mkdir('craft/storage');
            // this.dest.mkdir('craft/plugins');
            this.fs.copy(this.templatePath('html/_doc_head.twig'), this.destinationPath(templatePath+'/doc_head.twig'));
            this.fs.copy(this.templatePath('html/_js.twig'), this.destinationPath(templatePath+'/js.twig'));
            this.fs.copy(this.templatePath('html/_page_footer.twig'), this.destinationPath(templatePath+'/page_footer.twig'));
            this.fs.copy(this.templatePath('html/_page_header.twig'), this.destinationPath(templatePath+'/page_header.twig'));
            this.fs.copy(this.templatePath('html/_layout.twig'), this.destinationPath(templatePath+'/../_layout.twig'));
            this.fs.copy(this.templatePath('html/_404.twig'), this.destinationPath(templatePath+'/../404.twig'));
            this.fs.copy(this.templatePath('html/_index.twig'), this.destinationPath(templatePath+'/../index.twig'));

            // copy configuration and grunt
            this.fs.copy(this.templatePath('_bower.json'), this.destinationPath('bower.json'));
            this.fs.copyTpl(this.templatePath('_gulpfile.js'), this.destinationPath('gulpfile.js'), context);


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
