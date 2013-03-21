!function() {
    
    // Node deps
    var fs = require( 'fs' )
        , path = require( 'path' )
        ;
    
    // NPM deps
    var glob = require( 'glob' )
        , cssmin = require( 'ycssmin' ).cssmin
        ;
    
    // Local deps
    var log = require( './lib/logger' )
        , fsh = require( './lib/fs-helper' )
        ;
        
    function error( msg, heading ) {
        
        if ( !heading ) msg = '[Error] ' + msg;
        
        log.error( msg, heading );
        process.exit(1);
    }
    
    /**
     * CSSCat
     * 
     * @module CSSCat
     * @constructor
     */
    function CSSCat( config ) {
        
        this.options = {
            dir: '',
            files: [],
            debug: false,
            exclude: /^\.|\/\.|node_modules/,
            optimize: true
            /* Potential Hooks
            concatenate: function( content ) {
                // alter content
                return content
            },
            optimize: function ( content ) {
                // optimize content
                return content
            }
            */
        }
        
        this.files = {
            data:{},
            graph:{},
            order:{}
        }
    }
    
    CSSCat.prototype = {
        
        /**
         * Configure options and files.
         * 
         * @method init
         * 
         * @param config {Object}
         *      @param dir {String} CSS directory path.
         *      @param debug {Boolean} Log debugging info.
         */
        init: function( config ) {
            
            var list;

            // Set up logger options
            log.config( config );
            
            // Update options
            log.info( 'Extending CSSCat options.' );
            for ( key in this.options ) {
               if ( key in config ) this.options[ key ] = config[ key ];
            }

            if ( !this.options.dir ) error( 'No directory defined.' );

            this.options.dir = path.resolve( this.options.dir );
            if ( !fsh.exists( this.options.dir ) ) error( 'Target directory could not be found: ' + this.options.dir );
            
            // Get the list of css files
            list = this.options.files;
            if ( !list.length ) {
               
                log.info( 'Getting list of CSS files.' );
                list = fsh.glob( '**/*.css', {
                    dir: this.options.dir,
                    exclude: this.options.exclude
                });
            }
            if ( !list ) error( 'Couldn\'t find any css files in given directory' );

            // Build the various data structures
            log.info( 'Creating the files object.' );
            this.files = this.buildFileObject( list );
            this.files.order = this.sortByDependency( this.files.graph );

            // Debug logging
            log.debug( list, 'File Listing' );
            log.debug( this.options, 'Options' );
            log.debug( this.files.data, 'File Data' );
            log.debug( this.files.graph, 'Dependency Graph' );
            log.debug( this.files.order, 'Optimize Order' );
            
            this.process();
        },
        
        /**
         * Description needed
         * 
         * @method name
         */
        process: function() {
            
            var files = this.files.order;
            
            log.info( 'Handling dependencies with media conditions:' );
            files.forEach( this.buildMediaBlock, this );
            
            log.info( 'Concatinating and/or optimizing:' );
            files.forEach( this.concatenate, this );

            log.success( '\n Finished! \n' );
        },
        
        /**
         * Builds a files object and dependency graph.
         *
         *      // data structure
         *      {
         *          'absolute/path/to/parent/file.css': {
         *              imports: {
         *                  'absolute/path/to/dependency/file.css': {
         *                      statement: '@import url( \'dependency/file.css\' ) screen and ( min-width: 100px );',
         *                      path: 'dependency/file.css',
         *                      rule: '@import url( \'dependency/file.css\' );',
         *                      condition: 'screen and ( min-width: 100px )'
         *                  }
         *              }
         *          }
         *      }
         *      
         *      // graph structure
         *      {
         *          'absolute/path/to/parent/file.css': [ 
         *              'absolute/path/to/dependency/dep-1.css',
         *              'absolute/path/to/dependency/dep-2.css'
         *          ]
         *      }
         * 
         * @method buildFileObject
         * 
         * @param list {Array} An array of file paths.
         * 
         * @return {Object} An object that contains the `data` and `graph` objects.
         */
        buildFileObject: function( list ) {

            var file
                , absPath
                , matches
                , curFile
                , curMatch
                , curImport
                , fileContents
                , absPathImport
                , data = {}
                , graph = {}
                , rQuotes = /['"]/g
                , rImport = /\@import\s*(?:url\()?\s*["']([^'"]*)['"]\s*\)?\s*(.*?);/
                , rImportGlobal = /\@import\s*(?:url\()?\s*["']([^'"]*)['"]\s*\)?\s*(.*?);/g
                ;
            
            list.forEach( function( file ) {
                
                absPath = path.join( this.options.dir, file );
                fileContents = fsh.readFile( absPath );
                
                if ( !fileContents ) error( 'File does not exist: "' + absPath + '"' );
                
                graph[ absPath ] = [];
                curFile = data[ absPath ] = {};
                matches = fileContents.match( rImportGlobal );
                
                if ( !matches ) return;
                
                curFile.imports = {}
                
                matches.forEach( function( theMatch ) {
                    
                    curMatch = theMatch.match( rImport );
                    absPathImport = path.resolve( path.dirname( absPath ), curMatch[1].replace( rQuotes, '' ) );
                    graph[ absPath ].push( absPathImport );
                    curImport = curFile.imports[ absPathImport ] = {
                        statement: curMatch[0],
                        path: curMatch[1],
                        rule: [ "@import '", curMatch[1], "';" ].join(''),
                        condition: curMatch[2]
                    }
                    
                });
                
            }, this );
            
            return {
                data: data,
                graph: graph
            }
        },
        
        /**
         * Create a flat list of files ordered by their dependencies.
         * 
         * @param graph {Object} Each file path as a key with its value an array of files it dependeds on.
         */
        sortByDependency: function( graph ) {

            var sorted = [] 
                , visited = {}
                ;

            var visit = function( name, ancestors ) {

                if ( visited[ name ] ) return;

                if ( !Array.isArray( ancestors ) ) ancestors = [];

                ancestors.push( name );
                visited[ name ] = true;

                graph[ name ].forEach( function( dep ) {

                    // If already in ancestors, a closed chain exists.
                    if ( ancestors.indexOf( dep ) >= 0 ) {
                        error( 'Circular dependency found: "' +  dep + '" is required by "' + name + '"( ' + ancestors.join( ' -> ' ) + ' )' );
                    }

                    visit( dep, ancestors.slice( 0 ) );
                });

                sorted.push( name );
            }

            Object.keys( graph ).forEach( visit );

            return sorted;
        },
        
        /**
         * Wraps `@media` blocks around each `@import` dependency that uses a media query.
         * 
         * @param thePath {String} The absolute path to the file. Maps to the key in the `files.data` object.
         */
        buildMediaBlock: function( thePath ) {

            var content
				, mediaBlock
                , importFile
                , fileData = this.files.data[ thePath ]
                ;
            
            // Make sure there are `@import` statements
            if ( !fileData.imports ) return log.minor( '  [skip] ' + thePath );
            
			content = fsh.readFile( thePath );
			
            for ( var file in fileData.imports ) {

                importFile = fileData.imports[ file ];
                
                if ( !importFile.condition ) continue;
                
                // Create the `@media` block
                mediaBlock = [
                    '@media ', importFile.condition, ' {\n',
                        importFile.rule, '\n',
                    '}'
                ].join('');
                
                // Update the content
                content = content.replace( importFile.statement, mediaBlock );
            }
            
            // Write the new content to the file
            fsh.writeFile( thePath, content );
            log.major( '  [meow] ' + thePath );
        },
        
        /**
         * Find and rplace all `@import` statements with content.
         * 
         * @method concatenate
         */
        concatenate: function( thePath, fileData ) {
            
            var content
				, pattern
				, importContent
				, opts = this.options
                , fileData = this.files.data[ thePath ]
                ;
                        
            // Skip if no `@import` statements and no optimization needed
            if ( !opts.optimize && !fileData.imports ) return log.minor( '  [skip] ' + thePath );
            
			content = fsh.readFile( thePath );
			
			// Make sure there are `@import` statements
			if ( !fileData.imports ) {
			    
			    for ( var importPath in fileData.imports ) {

    				pattern = fileData.imports[ importPath ].rule;
    				importContent = fsh.readFile( importPath );

                    // Update the content
                    content = content.replace( pattern, importContent );
    			}
			}
			
			if ( this.options.optimize ) content = cssmin( content );
			
            // Write the new content to the file
            fsh.writeFile( thePath, content );
            log.major( '  [meow] ' + thePath );    
        }
    }
    
    module.exports = new CSSCat;

}();