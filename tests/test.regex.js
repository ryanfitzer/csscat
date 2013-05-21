'use strict';

var fs = require( 'fs' )
    , path = require( 'path' )
    , csscat = require( '../main' )
    ;

var regEx = {
    
    dir: path.resolve( './tests/regex' ),
    
    rAssetURLs: function() {
        
        var match
            , result = []
            , regex = csscat.test.rAssetURLs
            , content = fs.readFileSync( regEx.dir + '/asset-urls.css', 'utf8' )
            , expected = require( regEx.dir + '/asset-urls-expected.js' )
            ;
        
        // Push the first capture for each match onto the result array
        while ( match = regex.exec( content ) ) result.push( match[1] );

        result.should.eql( expected );
    },
    
    rImportGlobal: function() {
        
        var match
            , regex = csscat.test.rImportGlobal
            , content = fs.readFileSync( regEx.dir + '/import-parts.css', 'utf8' )
            , expected = require( regEx.dir + '/import-parts-expected.js' )
            ;
        
        var result = {
            paths: [],
            conditions: []
        }
        
        // Push the first capture for each match onto the result array
        while ( match = regex.exec( content ) ) {
            
            result.paths.push( match[1] );
            result.conditions.push( match[2] );
        }

        result.paths.should.eql( expected.paths );
        result.conditions.should.eql( expected.conditions );
    }
}

describe( '[RegEx Match]', function() {
    it( '`rAssetURLs` should capture the asset paths', regEx.rAssetURLs );
    it( '`rImportGlobal` should capture the paths and media conditions', regEx.rImportGlobal );
});