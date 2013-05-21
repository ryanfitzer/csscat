# CSSCat [![Build Status](https://travis-ci.org/ryanfitzer/csscat.png?branch=master)](https://travis-ci.org/ryanfitzer/csscat) #

CSSCat is a [Node.js][nodejs] tool for managing CSS dependencies. Its goal is to facilitate CSS modularity through the liberal use of `@import` statements ([including ones with media conditions][mqs]) during development that can then be concatenated into single files for production.

Instead of creating long manifests of files that need to be concatenated together by a build tool, CSSCat does this for you by tracing the dependency tree by reading a file's `@import` statements. This enables you to leverage `@import` statements during development and concatenated/minified CSS in production. And without having to rewrite your `<link>` tags to point to "some-file.min.css".

**Why not just use one of the various CSS preprocessors available these days**, you ask? Good question. I wrote CSSCat for those who don't use a preprocessor and/or for when a project's limitations exclude a preprocessor as an option. Since CSSCat operates on valid CSS, switching to another tool is simple.

**Note**: CSSCat does not copy the project files into a new directory before processing. This [gist][copy-files] shows how to use CSSCat's `fsh` module in your build.js file to easily generate a copy of the your project.

**CSSCat IS IN THE ALPHA STAGES**. So please use with caution. Due to its file transformation functionality, it should only be used in a manner that does not jeopardize your valuable work. More testing and real-world use is needed to ensure a solid tool that functions as advertised.

With that said, testers are needed (and much appreciated)! Please log any issues or features and I'll follow up as soon as possible.


## Features ##

- Concatenates file dependencies by parsing their `@import` statements ([including ones with media conditions][mqs]). CSSCat correctly wraps the imported CSS in its equivalent `@media` block. For example:

    **Before**:

        @import url( 'a.css' ) screen and ( min-width: 100px );


    **After**:

        @media screen and ( min-width: 100px ) {
        #some-id {
            display:awesome;
        }       
        }

- Rewrites relative asset paths to reference new context.
- Optionally optimizes each file via [CSSMin][CSSMin].


## Installation ##

    $ npm install csscat


## Usage ##

The only option needed to get started is the `dir` option. The path you provide should be relative to the file from which `csscat.init( options )` is invoked. The following configuration will process all files located in "my/css" and its subdirectories.

```js
    var csscat = require( 'csscat' );
    
    csscat.init({
        dir: 'my/css'
    });
```

You can also supply only a `files` option. Just like the `dir` option, the path should be relative to the file from which `csscat.init( options )` is invoked. The following configuration will process "a.css", "b.css", "c.css".

Please be aware that since CSSCat follows the dependency tree using the file's `@import` statements, any `@import` statements found pointing to files not listed in the `files` array will cause those files to also be processed.

```js
    var csscat = require( 'csscat' );
    
    csscat.init({
        files: [
            'my/css/a.css',
            'my/css/b.css',
            'my/css/c.css'
        ]
    });
```

You can use the `ignore` option to insure that certain files are skipped. The strings found in the `ignore` array are matched against the values in `@import` statements. If a file's `@import` statement contains a match to one of these strings, that file and all of its ancestors (the files that import it) are skipped. This is needed to avoid creating invalid CSS.

```js
    var csscat = require( 'csscat' );
    
    csscat.init({
        dir: 'my/css',
        ignore: [ 'd.css' ]
    });
```

The `exclude` option enables you to exclude certain files and directories via regular expression matching. Be aware that, like the earlier example,  any `@import` statements found pointing to files meant for exclusion will still be processed.

```js
        var csscat = require( 'csscat' );
    
        csscat.init({
            dir: 'my/css',
            exclude: /pattern/
        });
```


## Options ##

- `dir` {String} The base path (relative to the file from which `csscat.init` is invoked) used to search for all files with a "css" extension.

- `files` {Array} (Optional) An array of files to use instead of searching the `dir` path.   

    - If the paths are not absolute, they must be relative to the file from which `csscat.init` is invoked.
    - If the `dir` path is defined, the paths cannot be absolute, they must be relative to the `dir` path.

- `optimize` {Boolean} Minify via CSSMin.

- `exclude` {RegEx} Regex exclusion pattern used to filter the list of files to process. Defaults to `/^\.|\/\.|node_modules/`, which filters out anything that begins with "." or "node_modules". **NOTE**: If an excluded file is a dependency of a non-excluded file, the file will be parsed. See the `ignore` option for an alternative way to skip files.

- `ignore` {Array} Array of strings to match against when parsing the `@import` statements of a file. If a match is found, the file and all of the ancestor files in its dependency chain will be skipped.

- `log` {Boolean} Disable logging. Defaults to `true`.

- `debug` {Boolean} Enable debug logging. Defaults to `false`.


## The Files Object ##

The call to `csscat.init( options )` returns a files object containing the `data` and `order` members.

### The `data` Object ###

The `data` object stores information on each file. The file's absolute path is represented as a key.

- `skip` {Boolean} If the file was skipped for any reason. A file is skipped if one of its dependencies can not be resolved. This is due to using non-relative paths (absolute/URLs) in an `@import` statement or one of its `@import` statement's paths was found in the options `ignore` array.
- `imports` {Object} Information on each of the file's dependencies.
    - `statement` {String} The full `@import` statement as found in the source.
    - `path` {String} The original path found in the `@import` statement.
    - `rule` {String} The `@import` rule, sans any media condition.
    - `condition` {String} The media condition. Empty string if no media condition is found.

### The `order` Array ###

The `order` array is an ordered list of files (absolute paths) that have been processed. The order is determined by the dependency tree. Skipped files are not included.


## Testing ##

### OSX ###

    $ cd path/to/where/you/installed/csscat
    $ npm test

### Windows ###

Since Windows does not recognize executables the same as OSX you need to run the following:

    $ cd path\to\where\you\installed\csscat
    $ node node_modules/.bin/mocha --reporter list --require should tests

#### Viewing the Results in the Browser ####

Each test in "tests/options/actual" be viewed in the browser, which allows for easy visual debugging. Simply drag the test's "index.html" file to your browser. If you find a particular scenario in your css organization that fails, open an issue.

#### Reading the Results ####

*PASS*: All text is green. A green checkmark image to the left of each item's text.

*FAIL*: Red text and/or red "x" image (or no "x" image) to the left of each item's text.


## Roadmap ##

- Compatibility with other tools ([RequireJS][requirejs], [Grunt][grunt]) (almost done with the GruntJS plugin).
- Converting images to `data-uri` via some sort of flag in the property.
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
