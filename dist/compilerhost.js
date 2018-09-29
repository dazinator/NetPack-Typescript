"use strict";
/// <reference path="../typings/index.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const path = require("path");
class TypescriptCompilerHost {
    constructor(options) {
        this.sources = {};
        this.outputs = {};
        this._setParentNode = true;
        this._fallbackToFiles = true;
        this.getNewLine = () => ts.sys.newLine;
        this.options = options || {};
    }
    getStringFile(path) {
        var filePath = path;
        var caseSensitive = this.useCaseSensitiveFileNames();
        var obj = this.sources;
        for (var propName in obj) {
            if (obj.hasOwnProperty(propName)) {
                if (!caseSensitive) {
                    if (propName.toLowerCase() == path.toLowerCase()) {
                        return obj[propName];
                    }
                }
                else {
                    if (propName == path) {
                        return obj[propName];
                    }
                }
            }
        }
        return undefined;
    }
    // Implementing CompilerHost interface
    getSourceFile(filename, languageVersion, onError) {
        var file = this.getStringFile(filename);
        if (file) {
            return ts.createSourceFile(filename, file, languageVersion, true);
        }
        if (path.normalize(filename) === this.getDefaultLibFileName())
            return this.readFromFile(filename, languageVersion, onError);
        if (this._fallbackToFiles)
            return this.readFromFile(filename, languageVersion, onError);
        return undefined;
    }
    readFile(fileName) {
        var file = this.getStringFile(fileName);
        if (file) {
            return file;
        }
        if (path.normalize(fileName) === this.getDefaultLibFileName())
            return ts.sys.readFile(path.normalize(fileName));
        return "";
    }
    writeFile(filename, data, writeByteOrderMark, onError) {
        this.outputs[filename] = data;
    }
    ;
    fileExists(path) {
        var file = this.getStringFile(path);
        if (file) {
            return true;
        }
        return false;
    }
    getDirectories(path) {
        return ts.sys.getDirectories(path);
    }
    useCaseSensitiveFileNames() {
        return ts.sys.useCaseSensitiveFileNames;
    }
    getCurrentDirectory() {
        return ""; //ts.sys.getCurrentDirectory();
    }
    getDefaultLibFileName() {
        var libFile = path.normalize(ts.getDefaultLibFilePath(this.options));
        return libFile;
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
        this.sources[source.fileName] = source.contents;
    }
    getSourcesFilenames() {
        var keys = [];
        var sources = this.sources;
        for (var k in sources)
            if (sources.hasOwnProperty(k))
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
    compileStrings(input, options, onError) {
        var host = new TypescriptCompilerHost(options);
        var sources = [];
        if (Array.isArray(input) && input.length) {
            // string[]
            if (typeof input[0] == 'string') {
                sources.push(new StringSource(input[0])); // ts.map<string, StringSource>(input, );
            }
            // Source[]
            else if (input[0] instanceof StringSource) {
                sources.concat(input);
            }
            else
                throw new Error('Invalid value for input argument');
        }
        // dictionary
        else if (typeof input == 'object') {
            for (var k in input)
                if (input.hasOwnProperty(k))
                    sources.push(new StringSource(input[k], k));
        }
        else
            throw new Error('Invalid value for input argument');
        return this._compile(host, sources, options, onError);
    }
    _compile(host, sources, options, onError) {
        var files;
        sources.forEach(s => host.addSource(s.fileName, s.contents));
        files = host.getSourcesFilenames();
        var program = ts.createProgram(files, options, host);
        let emitResult = program.emit();
        let allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
        let errors = [];
        allDiagnostics.forEach(diagnostic => {
            var errorResult = {};
            if (diagnostic.file !== undefined) {
                let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                errorResult["File"] = diagnostic.file.fileName;
                errorResult["Line"] = line + 1;
                errorResult["Char"] = character + 1;
            }
            else {
                errorResult["File"] = "";
                errorResult["Line"] = 0;
                errorResult["Char"] = 0;
            }
            let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            errorResult["Message"] = message;
            errors.push(errorResult);
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
                    onError(e);
                });
            }
        }
    }
}
exports.default = NetPackTypescriptCompiler;
//# sourceMappingURL=compilerhost.js.map