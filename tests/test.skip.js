'use strict';

var fs = require( 'fs' )
    , path = require( 'path' )
    , util = require( 'util' )
    , assert = require( 'assert' )
    , csscat = require( '../main' )
    ;

var skip = {
    
    dir: path.resolve( './tests/skip' ),
    
    ignoreOption: function() {
        
        var pass = true;
        
        var fileObj = csscat.init({
            log: false,
            dir: skip.dir + '/ignore',
            optimize: false,
            ignore: [ 'c.css' ]
        }).data;
        
        
        for ( var name in fileObj ) {

            var data = fileObj[ name ];
            
            if ( !data.skip && name.lastIndexOf( 'c.css' ) === -1 ) pass = false;
        }
        
        pass.should.eql( true );
    },
    
    nonRelativePaths: function() {
        
        var pass = true;
        
        var fileObj = csscat.init({
            log: false,
            dir: skip.dir + '/nonRelativePaths',
            optimize: false
        }).data;
        
        
        for ( var name in fileObj ) {

            if ( !fileObj[ name ].skip ) pass = false;
        }
        
        pass.should.eql( true );
    }
}

describe( '[Skip]', function() {
    it( '{a, b, c}.css should be skipped due to ignore', skip.ignoreOption );
    it( '{a, b}.css should be skipped due to unresolvable dependencies', skip.nonRelativePaths );
});