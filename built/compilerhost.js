/// <reference path="../typings/globals/typescript/index.d.ts" />
/// <reference path="../typings/globals/node/index.d.ts"/>
"use strict";
const ts = require("typescript");
const path = require("path");
class TypescriptCompilerHost {
    constructor(options) {
        this._sources = {};
        this._outputs = {};
        this._setParentNode = true;
        this._fallbackToFiles = false;
        this.shallowClone = (obj) => {
            var clone = {};
            for (var k in obj)
                if (obj.hasOwnProperty(k)) {
                    clone[k] = obj[k];
                }
            return clone;
        };
        this.getNewLine = () => ts.sys.newLine;
        this.options = options || {};
        // this.options.defaultLibFilename = this.options.defaultLibFilename || '';
    }
    get sources() {
        return this.shallowClone(this._sources);
    }
    get outputs() {
        return this.shallowClone(this._outputs);
    }
    // Implementing CompilerHost interface
    getSourceFile(filename, languageVersion, onError) {
        if (path.normalize(filename) === this.getDefaultLibFileName())
            return this.readFromFile(filename, languageVersion, onError);
        if (this._sources[filename])
            return ts.createSourceFile(filename, this._sources[filename], languageVersion, true);
        if (this._fallbackToFiles)
            return this.readFromFile(filename, languageVersion, onError);
        return undefined;
    }
    readFile(fileName) {
        if (this._sources[fileName])
            return this._sources[fileName];
        if (path.normalize(fileName) === this.getDefaultLibFileName())
            return ts.sys.readFile(path.normalize(fileName));
        return "";
    }
    writeFile(filename, data, writeByteOrderMark, onError) {
        this._outputs[filename] = data;
    }
    ;
    fileExists(path) {
        return this.sources.hasOwnProperty(path);
    }
    useCaseSensitiveFileNames() {
        return ts.sys.useCaseSensitiveFileNames;
    }
    getCurrentDirectory() {
        return "";
    }
    getDefaultLibFileName() {
        return path.join(__dirname, "lib", "lib.d.ts");
    }
    getCanonicalFileName(fileName) {
        // if underlying system can distinguish between two files whose names differs only in cases then file name already in canonical form.
        // otherwise use toLowerCase as a canonical form.
        return ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase();
    }
    // Helper functions
    readFromFile(filename, languageVersion, onError) {
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
    }
    addSource(nameOrContents, contents) {
        var source;
        if (typeof contents == 'undefined')
            source = new StringSource(nameOrContents);
        else
            source = new StringSource(contents, nameOrContents);
        this._sources[source.fileName] = source.contents;
    }
    getSourcesFilenames() {
        var keys = [];
        for (var k in this.sources)
            if (this.sources.hasOwnProperty(k))
                keys.push(k);
        return keys;
    }
}
exports.TypescriptCompilerHost = TypescriptCompilerHost;
class StringSource {
    constructor(contents, fileName = StringSource._nextFilename()) {
        this.contents = contents;
        this.fileName = fileName;
    }
    static _nextFilename() {
        return "input_string" + (++StringSource._counter) + '.ts';
    }
    resetCounter() {
        StringSource._counter = 0;
    }
}
StringSource._counter = 0;
exports.StringSource = StringSource;
class NetPackTypescriptCompiler {
    compileStrings(input, tscArgs, options, onError) {
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
    }
    _compile(host, sources, tscArgs, options, onError) {
        if (typeof tscArgs == "string")
            tscArgs = tscArgs.split(' ');
        else
            tscArgs = tscArgs || [];
        var commandLine = ts.parseCommandLine(tscArgs);
        var files;
        sources.forEach(s => host.addSource(s.fileName, s.contents));
        files = host.getSourcesFilenames();
        var program = ts.createProgram(files, commandLine.options, host);
        let emitResult = program.emit();
        let allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
        let errors = [];
        allDiagnostics.forEach(diagnostic => {
            let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
            let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
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
            sources: host.outputs,
            errors: errors
        };
        function forwardErrors(errors, onError) {
            if (typeof onError == 'function') {
                errors.forEach(e => {
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
            var category = ts.DiagnosticCategory[diagnostic.category].toLowerCase();
            output += category + " TS" + diagnostic.code + ": " + diagnostic.messageText + ts.sys.newLine;
            return output;
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NetPackTypescriptCompiler;
//# sourceMappingURL=compilerhost.js.map