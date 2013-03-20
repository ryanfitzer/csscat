# CSSCat #

CSSCat is a [Node.js][nodejs] tool for managing CSS dependencies. Its goal is to facilitate CSS modularity through the liberal use of `@import` statements ([including ones with media conditions][mqs]) during development that can then be built into single files for production.

**Why not just use one of the various CSS preprocessors available these days**, you ask? Good question. I wrote CSSCat for those who don't use a preprocessor and/or for when a project's limitations exclude a preprocessor as an option.

**CSSCat IS IN THE ALPHA STAGES**. So please use with caution. Due to its file transformation functionality, it should only be used in a manner that does not jeopardize your valuable work. More testing and real-world use is needed to ensure a solid tool that functions as advertised.

With that said, testers are needed (and much appreciated)! Please log any issues or features and I'll follow up as soon as possible.


## Features ##

- Concatenates file dependencies by parsing their `@import` statements ([including ones with media conditions][mqs]). CSSCat correctly wraps the imported CSS in its equivalent `@media` block (also preserves its position in the cascade). For example:

    **Before**:
        
        @import url( 'a.css' ) screen and ( min-width: 100px );

        
    **After**:

        @media screen and ( min-width: 100px ) {
        #some-id {
            display:awesome;
        }       
        }

- Optimizes each file via [CSSMin][CSSMin].


## Installation ##

    $ npm install csscat


## Usage ##

    var csscat = require( 'csscat' );
    
    csscat.init({
        dir: 'path/to/css'
    });
    

**Note**: CSSCat does not copy the files into a new directory before processing. This [gist][copy-files] shows how to use use CSSCat's fs-helper in a build.js file to easily generate a copy of the original directory.

## Options ##

- `debug` {Boolean} Enable verbose logging. Defaults to `false`.

- `dir` {String} The path (relative to the file from which `csscat.init` is invoked) used to search for all files with a "css" extension.

- `exclude` {RegEx} Regex exclusion pattern used to filter the results. Defaults to `/^\.|\/\./`, which filters out all directories/files that start with a `.`.

- `optimize` {Boolean} Minify via CSSMin.


## Roadmap ##

- Unit tests
- Compatibility with other tools ([RequireJS][requirejs], [Grunt][grunt])
- Image `data-uri` inlining
- [Source map][source-maps-html5rocks] generation ([more explanation][source-maps-snugug]). Mozilla [has a nodejs package][moz-source-map].


[nodejs]: http://nodejs.org/
[mqs]: http://www.w3.org/TR/css3-mediaqueries/#media0
[copy-files]: https://gist.github.com/ryanfitzer/5202101
[CSSMin]: https://github.com/yui/ycssmin
[requirejs]: http://requirejs.org/
[grunt]: http://gruntjs.com/
[data-uri]:https://developer.mozilla.org/en-US/docs/data_URIs
[source-maps-html5rocks]:http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/
[moz-source-map]: https://github.com/mozilla/source-map
[source-maps-snugug]:http://snugug.com/musings/debugging-sass-source-maps
