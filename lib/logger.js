!function() {
    
    var colors = {
        'bgGreen':  ['\x1B[32;7m', '\x1B[m'],
        'grey':     ['\x1B[90m', '\x1B[39m'],
        'black':    ['\x1B[30m', '\x1B[39m'],
        'red':      ['\x1B[31m', '\x1B[39m'],
        'green':    ['\x1B[32m', '\x1B[39m'],
        'yellow':   ['\x1B[33m', '\x1B[39m'],
        'blue':     ['\x1B[34m', '\x1B[39m'],
        'magenta':  ['\x1B[35m', '\x1B[39m'],
        'cyan':     ['\x1B[36m', '\x1B[39m'],
        'white':    ['\x1B[37m', '\x1B[39m']
    }

    /**
     * Logger module
     * 
     * @module Logger
     * @constructor
     */
    function Logger() {
        
        // Defaults
        this.options = {
            debug: false,
            level: 1
        }
    }
    
    Logger.prototype = {
        
        config: function( config ) {
            
            for ( var key in this.options ) {
               if ( key in config ) this.options[ key ] = config[ key ];
            }
        },
        
        /**
         * Simple logger.
         * 
         * @method print
         * 
         * @param color {Array}
         * @param heading {String} (Optional)
         * @param msg {Mixed}
         */
        print: function( color, heading, msg ) {

            var args = [];
            
            if ( !this.options.level ) return;
            
            if ( heading ) args.push( color[0] + heading + ':' + color[1] )

            if ( typeof msg === 'object' ) msg = JSON.stringify( msg, null, '\t' );

            args.push( color[0] + msg + color[1] );

            args.forEach( function( text ) {
                console.log( text );
            });
            
            console.log( ' ' );
        },
        
        info: function( msg, heading ) {
            this.print( colors.white, heading, msg );
        },
        
        major: function( msg, heading ) {
            this.print( colors.cyan, heading, msg );
        },
        
        minor: function( msg, heading ) {
            this.print( colors.grey, heading, msg );
        },
        
        warn: function( msg, heading ) {
            this.print( colors.yellow, heading, msg );
        },

        debug: function( msg, heading ) {
            
            if ( !this.options.debug ) return;
            
            if ( heading ) heading = '[Debug] ' + heading
            else heading = '[Debug]';
            
            this.print( colors.blue, heading, msg );
        },
        
        error: function( msg, heading ) {
            this.print( colors.red, heading, msg );
        },

        success: function( msg, heading ) {
            this.print( colors.green, heading, msg );
        }
    }
    
    module.exports = new Logger;
    
}();
