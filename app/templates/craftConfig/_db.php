<?php

/**
 * Database Configuration
 *
 * All of your system's database configuration settings go in here.
 * You can see a list of the default settings in craft/app/etc/config/defaults/db.php
 */

define('DB_NAME', '<%= _.slugify(appName) %>');

$dbConfig = array(
    '*' => array(
        'server' => 'localhost',
        'user' => '<%= _.slugify(appName) %>',
        'password' => '',
        'database' => DB_NAME,
        'tablePrefix' => 'craft',
    ),
    '.staging.' => array(
        'server' => 'localhost',
        'user' => 'root',
        'password' => '',
        'database' => DB_NAME,
        'tablePrefix' => 'craft'
    ),
    'local.' => array(
        'server' => 'localhost',
        'user' => 'root',
        'password' => 'root',
        'database' => DB_NAME,
        'tablePrefix' => 'craft'
    )
);

return $dbConfig;
