'use strict';

var fs = require( 'fs' )
    , path = require( 'path' )
    , csscat = require( '../main' )
    , fsh = require( '../lib/fs-helper' )
    ;
    
var testPath = path.resolve( './tests/options' )
    , samplePath = path.resolve( './tests/sample' )
    , controlPath = path.join( testPath, 'control' )
    , actualPath = path.join( testPath, 'actual' )
    ;

var options = {
    
    'dir': {
        dir: path.join( actualPath, 'dir' )
    },
    
    'files': {
        files: fsh.glob( path.join( actualPath, 'files/**/*.css' ) )
    },
    
    'dir-files': {
        dir: path.join( actualPath, 'dir-files' ),
        files: fsh.glob( '**/*.css', { dir: path.join( actualPath, 'dir-files' ) } )
    },
    
    'dir-ignore': {
        ignore: [ 'a/a.css' ],
        dir: path.join( actualPath, 'dir-ignore' )
    },
    
    'files-ignore': {
        ignore: [ 'a/a.css' ],
        files: fsh.glob( path.join( actualPath, 'files-ignore/**/*.css' ) )
    },
    
    'dir-exclude': {
        exclude: /^\.|\/\.|c\.css|node_modules/,
        dir: path.join( actualPath, 'dir-exclude' )
    },
    
    'files-exclude': {
        exclude: /^\.|\/\.|c\.css|node_modules/,
        files: fsh.glob( path.join( actualPath, 'files-exclude/**/*.css' ) )
    },
    
    'dir-files-ignore': {
        ignore: [ 'a/a.css' ],
        dir: path.join( actualPath, 'dir-files-ignore' ),
        files: fsh.glob( '**/*.css', { dir: path.join( actualPath, 'dir-files-ignore' ) } )
    }
}

function copy() {

    Object.keys( options ).forEach( function( name ) {
        
        var newDir = path.join( actualPath, name );        
            
        // Delete destination directory
        if ( fsh.exists( newDir ) ) fsh.rm( newDir );
         
        // Copy the target directory to the destination directory
        fsh.copyDir( samplePath, newDir );
        
    });
}

function process() {
    
    Object.keys( options ).forEach( function( name ) {
        
        var ops = options[ name ];
        
        ops.log = false;
        ops.debug = false;
        ops.optimize = true;
        
        csscat.init( ops );
    });
    
    
}

function test( name ) {
    
    var files = fsh.glob(  name + '/**/*.css', { dir: actualPath } );
    
    files.forEach( function( filePath ) {

        var control = fsh.readFile( path.join( controlPath, filePath ) );
        var actual = fsh.readFile( path.join( actualPath, filePath ) );
        
        if ( control !== actual ) {
            console.log( 'filePath:', filePath );
        }
        control.should.eql( actual );
    });

}

copy();
process();
describe( '[Options]', function() {
    
    Object.keys( options ).forEach( function( name ) {
        it( '(' + name + ') The files should be identical.', function() {
            test( name );
        });
    });
});