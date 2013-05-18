'use strict';

var fs = require( 'fs' )
    , path = require( 'path' )
    , csscat = require( '../main' )
    , fsh = require( '../lib/fs-helper' )
    , testDir = path.resolve( './tests/options' )
    ;

function tester( name ) {
    
    var controlDir = path.join( testDir, 'control' )
        , actualDir = path.join( testDir, 'actual' )
        , files = fsh.glob(  name + '/**/*.css', { dir: actualDir } )
        ;
    
    files.forEach( function( filePath ) {

        var control = fs.readFileSync( path.join( controlDir, filePath ) );
        var actual = fs.readFileSync( path.join( actualDir, filePath ) );

        control.should.eql( actual );
    });

}

var options = {
  
    'dir': function() {
        tester( 'dir' );
    },
    
    'files': function() {
        tester( 'files' );
    },
    
    'dir-files': function() {
        tester( 'dir-files' );
    },
    
    'dir-ignore': function() {
        tester( 'dir-ignore' );
    },
    
    'files-ignore': function() {
        tester( 'files-ignore' );
    },
    
    'dir-files-ignore': function() {
      tester( 'dir-files-ignore' );
  }
};

/*
    TODO Create the dir clean & copy (tests/sample -> tests/options/actual) and proccessing routine.
*/

describe( '[Options]', function() {
    
    Object.keys( options ).forEach( function( name ) {
        it( 'The files should be identical.', options[ name ] );
    });
});