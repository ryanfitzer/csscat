!function() {

    var path = require( 'path' )
        , childp = require( 'child_process' )
        , csscat = require( '../main' )
        , fsh = require( '../lib/fs-helper' )
        ;
    
    // The directory to copy (relative to this file)
    var original = './sample';
    
    // The base directory (relative to this file)
    var dir = './sample-build';
    
    // The test page to open in the browser
    // var results = 
    
    // Resolve to absolute paths (relative to this file's directory)
    original = path.resolve( __dirname, original );
    dir = path.resolve( __dirname, dir );
    
    // Delete destination directory
    if ( fsh.exists( dir ) ) fsh.rm( dir );
    
    // Copy the target directory to the destination directory
    console.log( '\nCopying files to the destination directory at "' + dir + '"\n' );
    fsh.copyDir( original, dir );
    
    // Now that the we have fresh copy, let's get busy on it
    var csscatObj = csscat.init({
        // debug: true,
        // ignore: [ 'aa/aa.css' ],
        optimize: false,
        dir: dir
    });
    
    console.log( JSON.stringify( csscatObj, null, '\t' ) );
}();