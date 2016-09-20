<?php

/**
 * Database Configuration
 *
 * All of your system's database configuration settings go in here.
 * You can see a list of the default settings in craft/app/etc/config/defaults/db.php
 */

define('DB_NAME', '<%= dbName %>');

$dbConfig = array(
    '*' => array(
        'server' => 'localhost',
        'user' => '<%= dbUsername %>',
        'password' => '<%= dbPasswordProduction %>',
        'database' => DB_NAME,
        'tablePrefix' => 'craft',
    ),
    '.staging.' => array(
        'server' => 'localhost',
        'user' => '<%= dbUsername %>',
        'password' => '<%= dbPasswordStaging %>',
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
