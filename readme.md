# CSSCat #

CSSCat is a nodejs tool to manage CSS dependencies. Its goal is to facilitate CSS modularity through the liberal use of `@import` statements during development that can then be built into single files for production.

**NOTE: PLEASE USE WITH CAUTION. CSSCAT IS CURRENTLY AN ALPHA RELEASE AND IS NOT CONSIDERED STABLE. DUE TO ITS FILE TRANSFORMATION FUNCTIONALITY, IT SHOULD ONLY BE USED IN A MANNER THAT DOES NOT JEOPARDIZE VALUABLE WORK. MORE TESTING AND REAL-WORLD USE IS NEEDED TO ENSURE A SOLID TOOL THAT FUNCTIONS AS ADVERTISED**.


## Features ##

- Concatenates file dependencies by parsing their `@import` statements (minification coming soon)
- Parses `@import` statements that include media conditions, wrapping the imported CSS in an equivalent `@media` block. Example:
    
    **Before**
        
        @import url( 'a.css' ) screen and ( min-width: 100px );

        
    **After**

        @media screen and ( min-width: 100px ) {
            #some-id {
                display:awesome;
            }       
        }

## Installation ##

    $ npm install csscat


## Usage ##

    var csscat = require( 'csscat' );
    var options = {
        
        // Enable to see the `files` object. It is also returned from `csscat.init`
        debug: false,
        
        // The relative to the file from which `csscat.init` is invoked.
        dir: 'path/to/css/directory'
    }
    
    csscat.init( {
        dir: '../css' // relative to the file from which `csscat.init` is invoked.
    });
    
    
Since CSSCat does not copy the files into a new directory before processing, you can use the following snippet in a build.js file to create a copy of the original directory you intend to build:

    var csscat = require( 'csscat' )
        , fsh = require( 'csscat/lib/fs-helper' )
        ;
    
    // Path to the directory to copy
    var original = 'css';
    
    var options = {
        dir: 'css-build'
    }

    // Delete destination directory
    if ( fsh.exists( options.dir ) ) fsh.rm( options.dir );

    // Copy the original directory to the destination directory
    fsh.copyDir( original, options.dir );
    
    csscat.init( options );


## Roadmap ##

- Unit tests
- Optimization/Minification options
- Compatibility with popular build tools (Grunt, etc.)
- Source maps- Source maps

