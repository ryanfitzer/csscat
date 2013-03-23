/*
  The parts
  
  
  @import url( 'some/file.css' ) media1 and ( expression1 ), media2 and ( expression2 )
  
  0 => match
  1 => url
  2 => media queries
  
  
  var sample = [
      '@import url( \'some/file.css\' ) media1 and ( expression1 ), media2 and ( expression2 );',
      'some/file.css',
      'media1 and ( expression1 ), media2 and ( expression2 )'
  ];
    
*/
var util = require( 'util' )
    , rQuotesRegEx = /'|"/g
    , rRelPathRegEx = /\.\.\/|\.\//g
    , rImport = /\@import\s*(?:url\()?\s*["']([^'"]*)['"]\s*\)?\s*(.*?);/
    , rImportGlobal = /\@import\s*(?:url\()?\s*["']([^'"]*)['"]\s*\)?\s*(.*?);/g
    , rule = "@import url( 'some/file.css?ryan=d$de' ) media1 and ( expression1: 'ryan' ), media2 and ( expression2 ) 'Alt'; body {};"
    ;
    
var curMatch = rule.match( rImport );

console.log( 
    util.inspect( curMatch, false, null )
);

