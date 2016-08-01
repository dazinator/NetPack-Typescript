/// <reference path="../typings/index.d.ts" />
"use strict";
var ts = require("typescript");
var path = require("path");
var TypescriptCompilerHost = (function () {
    function TypescriptCompilerHost(options) {
        var _this = this;
        this._sources = {};
        this._outputs = {};
        this._setParentNode = true;
        this._fallbackToFiles = false;
        this.shallowClone = function (obj) {
            var clone = {};
            for (var k in obj)
                if (obj.hasOwnProperty(k)) {
                    clone[k] = obj[k];
                }
            return clone;
        };
        this.sources = function () {
            return _this.shallowClone(_this._sources);
        };
        this.outputs = function () {
            return _this.shallowClone(_this._outputs);
        };
        this.getNewLine = function () { return ts.sys.newLine; };
        this.options = options || {};
        // this.options.defaultLibFilename = this.options.defaultLibFilename || '';
    }
    // get sources(): ts.Map<string> {
    //     return this.shallowClone(this._sources);
    // }
    // get outputs(): ts.Map<string> {
    //     return this.shallowClone(this._outputs);
    // }
    // Implementing CompilerHost interface
    TypescriptCompilerHost.prototype.getSourceFile = function (filename, languageVersion, onError) {
        if (path.normalize(filename) === this.getDefaultLibFileName())
            return this.readFromFile(filename, languageVersion, onError);
        if (this._sources[filename])
            return ts.createSourceFile(filename, this._sources[filename], languageVersion, true);
        if (this._fallbackToFiles)
            return this.readFromFile(filename, languageVersion, onError);
        return undefined;
    };
    TypescriptCompilerHost.prototype.readFile = function (fileName) {
        if (this._sources[fileName])
            return this._sources[fileName];
        if (path.normalize(fileName) === this.getDefaultLibFileName())
            return ts.sys.readFile(path.normalize(fileName));
        return "";
    };
    TypescriptCompilerHost.prototype.writeFile = function (filename, data, writeByteOrderMark, onError) {
        this._outputs[filename] = data;
    };
    ;
    TypescriptCompilerHost.prototype.fileExists = function (path) {
        return this.sources.hasOwnProperty(path);
    };
    TypescriptCompilerHost.prototype.useCaseSensitiveFileNames = function () {
        return ts.sys.useCaseSensitiveFileNames;
    };
    TypescriptCompilerHost.prototype.getCurrentDirectory = function () {
        return ""; //ts.sys.getCurrentDirectory();
    };
    TypescriptCompilerHost.prototype.getDefaultLibFileName = function () {
        //var libes6File = path.normalize(__dir ts.getDefaultLibFilePath(this.options));
        var libFile = path.normalize(ts.getDefaultLibFilePath(this.options));
        return libFile;
    };
    TypescriptCompilerHost.prototype.getCanonicalFileName = function (fileName) {
        // if underlying system can distinguish between two files whose names differs only in cases then file name already in canonical form.
        // otherwise use toLowerCase as a canonical form.
        return ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase();
    };
    // Helper functions
    TypescriptCompilerHost.prototype.readFromFile = function (filename, languageVersion, onError) {
        try {
            var text = ts.sys.readFile(path.normalize(filename));
        }
        catch (e) {
            if (onError) {
                onError(e.message);
            }
            text = "";
        }
        return text !== undefined ? ts.createSourceFile(filename, text, languageVersion, this._setParentNode) : undefined;
    };
    TypescriptCompilerHost.prototype.addSource = function (nameOrContents, contents) {
        var source;
        if (typeof contents == 'undefined')
            source = new StringSource(nameOrContents);
        else
            source = new StringSource(contents, nameOrContents);
        this._sources[source.fileName] = source.contents;
    };
    TypescriptCompilerHost.prototype.getSourcesFilenames = function () {
        var keys = [];
        var sources = this.sources();
        for (var k in sources)
            if (sources.hasOwnProperty(k))
                keys.push(k);
        return keys;
    };
    return TypescriptCompilerHost;
}());
exports.TypescriptCompilerHost = TypescriptCompilerHost;
var StringSource = (function () {
    function StringSource(contents, fileName) {
        if (fileName === void 0) { fileName = StringSource._nextFilename(); }
        this.contents = contents;
        this.fileName = fileName;
    }
    StringSource._nextFilename = function () {
        return "input_string" + (++StringSource._counter) + '.ts';
    };
    StringSource.prototype.resetCounter = function () {
        StringSource._counter = 0;
    };
    StringSource._counter = 0;
    return StringSource;
}());
exports.StringSource = StringSource;
var NetPackTypescriptCompiler = (function () {
    function NetPackTypescriptCompiler() {
    }
    NetPackTypescriptCompiler.prototype.compileStrings = function (input, tscArgs, options, onError) {
        var host = new TypescriptCompilerHost(options);
        var sources = [];
        if (Array.isArray(input) && input.length) {
            // string[]
            if (typeof input[0] == 'string') {
                sources.push(new StringSource(input[0])); // ts.map<string, StringSource>(input, );
            }
            else if (input[0] instanceof StringSource) {
                sources.concat(input);
            }
            else
                throw new Error('Invalid value for input argument');
        }
        else if (typeof input == 'object') {
            for (var k in input)
                if (input.hasOwnProperty(k))
                    sources.push(new StringSource(input[k], k));
        }
        else
            throw new Error('Invalid value for input argument');
        return this._compile(host, sources, tscArgs, options, onError);
    };
    NetPackTypescriptCompiler.prototype._compile = function (host, sources, tscArgs, options, onError) {
        if (typeof tscArgs == "string")
            tscArgs = tscArgs.split(' ');
        else
            tscArgs = tscArgs || [];
        var commandLine = ts.parseCommandLine(tscArgs);
        var files;
        sources.forEach(function (s) { return host.addSource(s.fileName, s.contents); });
        files = host.getSourcesFilenames();
        var program = ts.createProgram(files, commandLine.options, host);
        var emitResult = program.emit();
        var allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
        var errors = [];
        allDiagnostics.forEach(function (diagnostic) {
            var _a = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start), line = _a.line, character = _a.character;
            var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            errors.push({
                "File": diagnostic.file.fileName,
                "Line": line + 1,
                "Char": character + 1,
                "Message": message
            });
            // console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        });
        if (errors.length > 0) {
            forwardErrors(errors, onError);
        }
        return {
            sources: host.outputs(),
            errors: errors
        };
        function forwardErrors(errors, onError) {
            if (typeof onError == 'function') {
                errors.forEach(function (e) {
                    e.formattedMessage = formatError(e);
                    onError(e);
                });
            }
        }
        function formatError(diagnostic) {
            var output = "";
            if (diagnostic.file) {
                var loc = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                output += diagnostic.file.fileName + "(" + loc.line + "," + loc.character + "): ";
            }
            var category = ts.DiagnosticCategory[diagnostic.category];
            output += category + " TS" + diagnostic.code + ": " + diagnostic.messageText + ts.sys.newLine;
            return output;
        }
    };
    return NetPackTypescriptCompiler;
}());
exports.__esModule = true;
exports["default"] = NetPackTypescriptCompiler;
//# sourceMappingURL=compilerhost.js.map