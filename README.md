# generator-origin-craft 

> [Yeoman](http://yeoman.io) generator for [Craft](http://www.buildwithcraft.com), [Zurb Foundation](http://foundation.zurb.com/), [Grunt](http://gruntjs.com/), [Browserify](http://browserify.org/), [Babel](https://babeljs.io/)


## Included

- Craft
- Gulp
- Browserify (with babel transform)
- Zurb Foundation


##Usage

To get all the goodness:

    mkdir your-project-name && cd your-project-name
    yo origin-craft

**NOTE: Craft is subject to licensing. This generator assumes you have read the terms of the Craft License Agreement, which are available [here](http://buildwithcraft.com/license)**

This will:

- Download latest version of Craft and untar it
- Drop the default templates into craft/templates
- Drop some default multi-environment config into craft/config
    - It will assume that you create a local virtualhost with 'local.' in the hostname
    - It will assume that you run your staging with '.staging.' in the hostname
    - It will assume your databases are running at localhost
    - You might have to change the username/passwords in craft/config/db.php
    - There are no real differences between production and staging enviroments, but the config block are there for convenience
    
You develop in the src directory. Running 

    gulp

in the command line will run the development target, watch your files and move the results into the public directory, from where it will be served by Craft.

Running

    gulp build
    
will tarball the entire application (with Craft) so you can move it to the server where it is supposed to run, and untar it there.

###Attention:
Because of a bug in decompress-unzip (which yo uses) you have to run the following commands in the root of the project (for now)
    
    find ./craft -type f  -exec chmod 644 {} \;
    find ./craft -type d  -exec chmod 755 {} \;

This is to ensure the correct permissions on the downloaded and unzipped files

## License

MIT
