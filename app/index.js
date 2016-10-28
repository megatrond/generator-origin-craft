'use strict';
var util = require('util');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var generators = require('yeoman-generator');
var yosay = require('yosay');
var Download = require('download');

var exec = require('child_process').exec;

var craftUrl = 'http://buildwithcraft.com/latest.zip?accept_license=yes';

var OriginCraftGenerator = generators.Base.extend({
    initializing: function () {
        this.pkg = require('../package.json');
    },

    prompting: function () {
        var done = this.async();
	var pathSegments = this.destinationRoot().split('/');
	this.appName = pathSegments[pathSegments.length - 1].replace(/[^a-z\d\s]/g, '-').toLowerCase();
	
    // Have Yeoman greet the user.
    this.log('\nScaffolding Craft project \''+this.appName+'\'\n');

    // only allow lowercase chars, numbers, and underscores in database name
    this.dbName = this.appName.replace(/[^a-z\d\s]/g, '_');
	
    done();
    
    },
    downloadCraft: function() {
        var done = this.async();
        // download and extract Craft (URL and version specified above)
        this.extract(craftUrl, '.', {mode: '755'}, function(error) {
            if (error) {
                console.log(error);
            } else {
                console.log('extracted');
                done();
            }
        });
    },
    setCraftConfig: function() {
        var generatePassword = function() {
            var pw = [];
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

            while (pw.length < 21) {
                pw.push(chars.charAt(Math.floor(Math.random() * chars.length)));
            }

            return pw.join('');
        };
        var done = this.async();
        var configPath = 'craft/config';
        this.dbName = this.appName.replace(/[^a-z\d\s]/g, '_');
        var context = {
            appName: this.appName,
            dbName: this.dbName,
            dbUsername: this.dbName.substring(0, 16),
            dbPasswordStaging: generatePassword(),
            dbPasswordProduction: generatePassword()
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
            var self = this;
            // this.fs.mkdir(this.destinationPath('src'));
            // this.fs.mkdir(this.destinationPath('src/scss'));
            mkdirp(this.destinationPath('src/fonts'));
            mkdirp(this.destinationPath('src/img'));
            // this.fs.mkdir(this.destinationPath('src/js'));

            var context = {
                appName: this.appName
            };
            this.fs.copyTpl(this.templatePath('_package.json'), this.destinationPath('package.json'), context);

            // copy main style and javascript files
            this.fs.copy(this.templatePath('scss/_styles.scss'), this.destinationPath('src/scss/styles.scss'));
            this.fs.copy(this.templatePath('js/_main.js'), this.destinationPath('src/js/main.js'));

            var templatePath = 'craft/templates/common';
            mkdirp(this.destinationPath(templatePath));
            mkdirp(this.destinationPath('craft/storage'));
            mkdirp(this.destinationPath('craft/plugins'));
	    
            this.fs.copy(this.templatePath('html/_doc_head.twig'), this.destinationPath(templatePath+'/doc_head.twig'));
            this.fs.copy(this.templatePath('html/_js.twig'), this.destinationPath(templatePath+'/js.twig'));
            this.fs.copy(this.templatePath('html/_page_footer.twig'), this.destinationPath(templatePath+'/page_footer.twig'));
            this.fs.copy(this.templatePath('html/_page_header.twig'), this.destinationPath(templatePath+'/page_header.twig'));
            this.fs.copy(this.templatePath('html/_layout.twig'), this.destinationPath(templatePath+'/../_layout.twig'));
            this.fs.copy(this.templatePath('html/_404.twig'), this.destinationPath(templatePath+'/../404.twig'));
            this.fs.copy(this.templatePath('html/_index.twig'), this.destinationPath(templatePath+'/../index.twig'));
	    this.fs.copy(this.templatePath('html/_styles.twig'), this.destinationPath(templatePath+'/styles.twig'));
            // copy gulpfile
            this.fs.copyTpl(this.templatePath('_gulpfile.js'), this.destinationPath('gulpfile.js'), context);

            // copy babelrc file
            this.fs.copyTpl(this.templatePath('babelrc'), this.destinationPath('.babelrc'), context);

            // rename htaccess to .htaccess
            this.fs.copy(this.destinationPath('public/htaccess'), this.destinationPath('public/.htaccess'));

            fs.unlink(this.destinationPath('public/htaccess'), function(err) {
                if (err) {
                    self.log('Could not delete htaccess file, do it yourself');
                }
            });
        }
    },
    end: function () {
        this.log('\n');
        this.log('Congratulations! You have now installed Craft and some build tools. Here are a few tips:\n');
        this.log('Remember to create a local database for the project.\nThe generated config files expects a database named \''+this.dbName+'\', running on localhost\n');
        this.log('Craft expects you to have a virtualhost with \'local.\' in the hostname when developing.\n');
        this.log('npm dependencies have not been installed, remember to run \'npm install\'\n');
        this.log('Directory \'node_modules\' should be ignored in version control.\n')
        this.log('\n');
    }
});

module.exports = OriginCraftGenerator;
