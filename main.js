/*jshint laxcomma:true */
!function() {
    
    // Node deps
    var path = require( 'path' );
    
    // NPM deps
    var glob = require( 'glob' )
        , cssmin = require( 'ycssmin' ).cssmin
        ;
    
    // Local deps
    var log = require( './lib/logger' )
        , fsh = require( './lib/fs-helper' )
        ;

    // Matches single and double quotes
    var rQuotes = /['"]/g;
        
    // Captures the css asset path (no absolutes, bounding quotes, or spaces)
    var rAssetURLs = /url\(\s*(?:['"])?(?!data|http:|https:|ftp:|\/\/|\/)([^'"\)\s]+)/g;

    // Captures the `@import` path and media condition
    var rImport = /(?!.*\*\/)@import\s*(?:url\()?\s*["']([^'"]*)['"]\s*\)?\s*(.*?);/;
        
    // Global version of `rImport`
    var rImportGlobal = new RegExp( rImport.toString().slice( 1, rImport.toString().length - 1 ), [ 'g' ] );
    
    // Logs error and exits
    function error( msg ) {
        
        msg = '\x1B[31m' + '[Error] ' + msg + '\x1B[39m';

        console.log( msg );
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
            exclude: /^\.|\/\.|node_modules/,
            ignore: [],
            optimize: true,
            log: true,
            debug: false
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
        
        
        /*
            files = {
                data: {
                    'absolute/path/to/parent/file.css': {
                        skip: false,
                        imports: {
                            'absolute/path/to/parent/file-1.css': {
                                statement: '@import url( \'dependency/file.css\' ) screen and ( min-width: 100px );',
                                path: 'dependency/file.css',
                                rule: '@import url( \'dependency/file.css\' );',
                                condition: 'screen and ( min-width: 100px )'
                            }
                        }
                    }
                },
                graph: {
                    'absolute/path/to/parent/file-1.css': [ 
                        'absolute/path/to/dependency/file-4.css',
                        'absolute/path/to/dependency/file-3.css'
                    ]
                },
                order: [
                    'absolute/path/to/parent/file-1.css',
                    'absolute/path/to/parent/file-2.css',
                    'absolute/path/to/parent/file-3.css',
                    'absolute/path/to/parent/file-4.css',
                ]
            }
        */
        this.files = {
            data: {},
            graph: {},
            order: []
        }
        
        /*
            TODO: Potential return values
                    - A `test` option for accessing private members.
                    - A `config` method for substituting internal methods (RequireJS needs Rhino support).
        */
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
            
            this.config( config );
            this.createFileData();
            this.process();
            
            return {
                data: this.files.data,
                order: this.files.order
            };
        },
        
        /**
         * Description needed
         * 
         * @method createFileData
         */
        config: function( config ) {
            
            // Extend options
            for ( var key in this.options ) {
               if ( key in config ) this.options[ key ] = config[ key ];
            }
            
            // Set up logger options
            log.config( {
                debug: this.options.debug,
                level: this.options.log
            });

            if ( !this.options.dir && !this.options.files.length ) {
                error( 'No `dir` or `files` option defined. CSScat requires at least one of the options be defined.' );
            }
            
            if ( this.options.dir ) {
                
                this.options.dir = path.resolve( this.options.dir );
                if ( !fsh.exists( this.options.dir ) ) error( 'Directory could not be found at: ' + this.options.dir );
            }
            
            log.info( 'CSSCat options extended.' );
            
            log.debug( this.options, 'Options' );
        },
        
        /**
         * Description needed
         * 
         * @method createFileData
         */
        createFileData: function() {
            
            var list;
            
            // Get the list of css files
            list = this.options.files;
            if ( !list.length ) {
               
                log.info( 'Getting list of CSS files.' );
                list = fsh.glob( '**/*.css', {
                    dir: this.options.dir,
                    exclude: this.options.exclude
                });
            }
            if ( !list ) error( 'Could not find any css files in given directory.' );
            
            log.debug( list, 'File Listing' );
            
            // Build the various data structures
            log.info( 'Creating the file data/graph objects:' );
            this.files = this.buildFileObject( list );
            
            log.debug( this.files.data, 'File Data' );
            log.debug( this.files.graph, 'Dependency Graph' );
            
            log.info( 'Adding files to the processing list (ordered by dependency):' );
            this.files.order = this.sortByDependency( this.files.graph );
        },
        
        /**
         * Description needed
         * 
         * @method process
         */
        process: function() {
            
            var files = this.files.order
                , withOptimization = this.options.optimize ? 'with' : 'without'
                ;
            
            log.info( 'Handling imports with media conditions:' );
            files.forEach( this.buildMediaBlock, this );
            
            log.info( 'Concatenating files with their imports (' + withOptimization + ' optimization):' );
            files.forEach( this.concatenate, this );
            
            log.success( '\
                  {\n\
                 (*)\n\
                 J J\n\
CSSCat did her business without errors!');
        },
        
        /**
         * Builds a files object and dependency graph.
         *
         *      // data structure
         *      {
         *          'absolute/path/to/parent/file.css': {
         *              skip: false,
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
                , isIgnored
                , colonIndex
                , fileContents
                , absPathImport
                , origPathImport
                , firstSlashIndex
                , data = {}
                , graph = {}
                ;
            
            list.forEach( function( file ) {

                absPath = this.options.dir ? path.join( this.options.dir, file ) : path.resolve( file );
                fileContents = fsh.readFile( absPath );

                if ( !fileContents ) error( 'File does not exist: "' + absPath + '"' );
                
                graph[ absPath ] = [];
                curFile = data[ absPath ] = {};
                curFile.skip = false;
                var matches = fileContents.match( rImportGlobal );
                
                if ( matches ) {
                    
                    curFile.imports = {};
                
                    matches.forEach( function( theMatch ) {
                    
                        curMatch = theMatch.match( rImport );
                        origPathImport = curMatch[1].replace( rQuotes, '' );
                        absPathImport = path.resolve( path.dirname( absPath ), origPathImport ).replace( /\\/g, '/' );
                        firstSlashIndex = origPathImport.indexOf( '/' );
                        colonIndex = origPathImport.indexOf( ':' );
                        isIgnored = this.options.ignore.indexOf( origPathImport ) !== -1 ? true : false;
                        
                        // Skip files that start with '/' or have a protocol.
                        if ( isIgnored || origPathImport.charAt( 0 ) === '/' || ( colonIndex !== -1 && colonIndex < firstSlashIndex ) ) {
                        
                            curFile.skip = true;
                            absPathImport = origPathImport;
                        }
                        
                        graph[ absPath ].push( absPathImport );
                        curFile.imports[ absPathImport ] = {
                            statement: curMatch[0],
                            path: curMatch[1],
                            rule: [ "@import '", curMatch[1], "';" ].join(''),
                            condition: curMatch[2]
                        }
                    
                    }, this );
                }
                
                if ( curFile.skip ) {
                    log.warn( '  [warning] The file "' + file + '" has dependencies that are unresolvable or configured to be ignored.' );
                }
                else log.minor( '  [parsed] ' + absPath );
                
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
                , self = this
                , count = 0
                ;
            
            var checkSkippedDeps = function( imports ) {
                
                var fileObj
                    , toSkip = false
                    ;
                
                if ( !imports ) return toSkip;
                
                Object.keys( imports ).forEach( function( fileName ) {
                    
                    fileObj = self.files.data[ fileName ];
                    
                    if ( !fileObj ) toSkip = true;
                    
                    else if ( fileObj && fileObj.imports ) {
                        toSkip = checkSkippedDeps( self.files.data[ fileName ].imports );
                    }
                    
                    else if ( self.files.data[ fileName ].skip ) toSkip = true;
                });
                
                return toSkip;
            };
            
            var visit = function( name, ancestors ) {
                
                var toSkipFile = false
                    , parentFile = self.files.data[ name ]
                    , imports = parentFile.imports
                    ;
                
                if ( visited[ name ] ) return;

                if ( !Array.isArray( ancestors ) ) ancestors = [];

                ancestors.push( name );
                visited[ name ] = true;
                
                // Skip the file if it can't be processed.
                if ( parentFile.skip ) return;

                toSkipFile = checkSkippedDeps( imports );
                
                if ( toSkipFile ) return parentFile.skip = true;
                
                graph[ name ].forEach( function( dep ) {
                    
                    // If already in ancestors, a closed chain exists.
                    if ( ancestors.indexOf( dep ) >= 0 ) {
                        error( 'Circular dependency found: "' +  dep + '" is required by "' + name + '"( ' + ancestors.join( ' -> ' ) + ' )' );
                    }

                    visit( dep, ancestors.slice( 0 ) );
                });
                
                sorted.push( name );
                log.major( '  [' + ++count + '] ' + name );
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
                , mediaImports = []
                , fileData = this.files.data[ thePath ]
                ;
            
            // Make sure there are `@import` statements
            if ( fileData.skip || !fileData.imports ) return log.minor( '  [none] ' + thePath );
            
            content = fsh.readFile( thePath );
            
            for ( var file in fileData.imports ) {

                importFile = fileData.imports[ file ];
                
                if ( importFile.condition )  mediaImports.push( file );
            }
            
            // Make sure the `@import` statements have media conditions
            if ( !mediaImports.length ) return log.minor( '  [none] ' + thePath );
            
            mediaImports.forEach( function( file ) {
                
                importFile = fileData.imports[ file ];
                
                // Create the `@media` block
                mediaBlock = [
                    '@media ', importFile.condition, ' {\n',
                        importFile.rule, '\n',
                    '}'
                ].join('');
                
                // Update the content
                content = content.replace( importFile.statement, mediaBlock );
            }, this );
            
            // Write the new content to the file
            fsh.writeFile( thePath, content );
            log.major( '  [meow] ' + thePath );
        },
                
        /**
         * Find and replace all `@import` statements with content.
         * 
         * @method concatenate
         */
        concatenate: function( thePath ) {
            
            var content
                , pattern
                , importContent
                , opts = this.options
                , fileData = this.files.data[ thePath ]
                ;
                        
            // Skip if no `@import` statements and no optimization needed
            if ( fileData.skip || ( !opts.optimize && !fileData.imports ) ) return log.minor( '  [none] ' + thePath );
            
            content = fsh.readFile( thePath );
            
            // Make sure there are `@import` statements
            if ( fileData.imports ) {
                
                for ( var importPath in fileData.imports ) {

                    pattern = rImport;
                    importContent = fsh.readFile( importPath );
                    
                    // Fix asset paths
                    importContent = this.resolvePaths( thePath, importPath, importContent );
                    
                    // Update the content
                    content = content.replace( pattern, importContent );
                }
            }
            
            if ( this.options.optimize ) content = cssmin( content );
            
            // Write the new content to the file
            fsh.writeFile( thePath, content );
            log.major( '  [meow] ' + thePath );    
        },
        
        /**
         * Resolve asset paths to the parent that imports them.
         * 
         * @method resolvePaths
         * 
         * @param parentPath {String} Path to file that contains the `@import` statement.
         * @param childPath {String} Path to file being imported.
         * @param content {String} Content of file being imported.
         */
        resolvePaths: function( parentPath, childPath, content ) {
            
            var absAssetPath
                , relAssetPath
                , self = this
                ;
            
            content = content.replace( rAssetURLs, function ( match, assetPath ) {

                absAssetPath = path.resolve( childPath, assetPath );
                relAssetPath = path.relative( parentPath, absAssetPath );
                
                return match.replace( assetPath, relAssetPath ).replace( /\\/g, '/' );
            });
            
            return content;
        }
    }
    
    var api = new CSSCat();
    
    module.exports = {
        init: function ( config ) {
            
            var api = new CSSCat();
            
            return api.init( config )
        },
        test: {
            rAssetURLs: rAssetURLs,
            rImportGlobal: rImportGlobal
        }
    }

}();
