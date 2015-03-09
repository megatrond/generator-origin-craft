<?php

/**
 * General Configuration
 *
 * All of your system's general configuration settings go in here.
 * You can see a list of the default settings in craft/app/etc/config/defaults/general.php
 */
// Ensure our urls have the right scheme
define('URI_SCHEME',  ( isset($_SERVER['HTTPS'] ) ) ? "https://" : "http://" );
// The site url
// Needs to account for port numbers when developing
$port = $_SERVER['SERVER_PORT'] != 80 ? ':'.$_SERVER['SERVER_PORT'] : '';
define('SITE_URL',    URI_SCHEME . $_SERVER['SERVER_NAME'] . $port . '/');

// The site basepath
define('BASEPATH', 	  realpath(dirname(__FILE__) . '/../../public') . '/');

$appPath = explode('/', realpath(dirname(__FILE__) . '/../../'));

// We need this for certain staging environments, where the app will run in a directory
// on a shared host
define('APPNAME', $appPath[sizeof($appPath) - 1]);

$appName = APPNAME;


return array(

    // ------------------------------------------------------------
    // Environment: Production
    // ------------------------------------------------------------
    '*' => array(
        // Environmental variables
        // We can use these variables in the URL and Path settings
        // within the Craft Control Panel. For example:
        //    siteUrl   can be references as {siteUrl}
        //    basePath  can be references as {basePath}
        'environmentVariables' => array(
            'basePath' => BASEPATH,
            'siteUrl'  => SITE_URL
        ),
        'allowAutoUpdates' => false
    ),
    // ------------------------------------------------------------
    // Environment: Staging
    // ------------------------------------------------------------
    'dev.' => array(
        'environmentVariables' => array(
            'basePath' => BASEPATH,
            'siteUrl'  => SITE_URL . APPNAME . '/'
        ),
        'allowAutoUpdates' => false
    ),
    // ------------------------------------------------------------
    // Environment: Development
    // ------------------------------------------------------------
    'local.' => array(
        // Give us more useful error messages
        'environmentVariables' => array(
            'basePath' => BASEPATH,
            'siteUrl'  => SITE_URL
        ),
        'devMode' => true,

        // Route ALL of the emails that Craft
        // sends to a single email address.
        'testToEmailAddress'  => 'trond@origin.no',
        // only allow auto updates when running locally
        'allowAutoUpdates' => true,
        // misc settings useful for development
        'useCompressedJs'             => true,
        'cacheDuration'               => 'P1D',
        'cooldownDuration'            => 'PT5M',
        'maxInvalidLogins'            => 5,
        'invalidLoginWindowDuration'  => 'PT1H',
        'phpMaxMemoryLimit'           => '256M',
        // keep us logged in for 101 years when we're in development
        'userSessionDuration'           => 'P101Y',
        'rememberedUserSessionDuration' => 'P101Y',
        'rememberUsernameDuration'      => 'P101Y',
        // Chrome spoofs the UA string when emulating devices, so to make sure
        // we're not logged out of admin area whenever viewing the site
        // in a tab with emulation activated
        'requireMatchingUserAgentForSession' => false
    )
);

