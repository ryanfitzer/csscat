!function() {

    var fs = require( 'fs' )
        , path = require( 'path' )
        , globber = require( 'glob' )
        ;
        
    function exists( thePath ) {
        
        thePath = path.normalize( thePath );
        return fs.existsSync( thePath );
    }
    
    /**
     * Use globbing via [node-glob](https://github.com/isaacs/node-glob) and regex to return an array of paths.
     * 
     * @param pattern {String} Globbing pattern.
     * @param config {Object} Options.
     *      @param dir {String} The path to search in. Defaults to `cwd`.
     *      @param exclude {RegEx} Regular expression to filter results.
     */    
    function glob( pattern, config ) {
        
        var results
            , options = {}
            ;
        
        if ( config.dir ) options.cwd = path.normalize( config.dir );
        
        results = globber.sync( pattern, options );
        
        if ( !config.exclude ) return results;
        
        results = results.filter( function( path ) {
            return !config.exclude.test( path );
        });
        
        return results;
    }
    
    function rm( thePath ) {
        
        thePath = path.normalize( thePath );
        
        if ( !exists( thePath ) ) return;
        
        var contents
            , isDirectory = fs.statSync( thePath ).isDirectory()
            ;
        
        // Delete the file
        if ( !isDirectory ) return fs.unlinkSync( thePath );
        
        // Get the contents of the directory
        contents = fs.readdirSync( thePath );
        
        // First remove the files
        contents.forEach( function( name ) {
            
            rm( path.join( thePath, name ) );
        });
        
        // Delete the directory
        fs.rmdirSync( thePath );
    }
    
    function mkDir( dirPath ) {
        
        dirPath = path.normalize( dirPath );
        
        if ( exists( dirPath ) ) return;
        
        var curDir = ''
            , names = dirPath.split( path.sep )
            ;
        
        names.forEach( function( dir ) {
            
            curDir += dir + path.sep;

            if ( !dir || exists( curDir ) ) return;
            
            fs.mkdirSync( curDir );
        });
    }
    
    function readFile( thePath ) {
        
        thePath = path.normalize( thePath );
        return fs.readFileSync( thePath, 'utf8' );
    }
    
    function writeFile( name, content ) {
        
        var parent = path.dirname( name );

        if ( !exists( parent ) ) mkDir( parent );
        
        fs.writeFileSync( name, content );
    }
    
    function copyFile( srcPath,  destPath ) {
        
        var parent
            , content
            ;
            
        srcPath = path.normalize( srcPath );
        destPath = path.normalize( destPath );
                
        parent = path.dirname( destPath );
        content = fs.readFileSync( srcPath );
        
        if ( !exists( parent ) ) mkDir( parent );
        
        fs.writeFileSync( destPath, content );

        return true;
    }
    
    function copyDir( srcPath,  destPath ) {
        
        var files
            , stat
            , destName
            , srcDirname
            , copied = []
            ;
        
        srcPath = path.normalize( srcPath );
        destPath = path.normalize( destPath );
        srcDirname = path.dirname( srcPath );
        
        files = glob( '**/*', srcPath );
        
        files.forEach( function( name ) {
            
            name = path.join( srcPath, name );
            stat = fs.statSync( name );
            destName = name.replace( srcPath, destPath );
            
            if ( stat.isFile() ) return copyFile( name, destName );

            mkDir( destName );
        });
    }

    module.exports = {
        exists: exists,
        glob: glob,
        rm: rm,
        mkDir: mkDir,
        readFile: readFile,
        writeFile: writeFile,
        copyFile: copyFile,
        copyDir: copyDir
    }
     
}();