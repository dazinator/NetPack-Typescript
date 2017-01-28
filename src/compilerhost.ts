/// <reference path="../typings/index.d.ts" />

import * as ts from "typescript";
import * as path from "path";

export class TypescriptCompilerHost implements ts.CompilerHost {

    public sources: ts.Map<string> = {};
    public outputs: ts.Map<string> = {};
    public options: ts.CompilerOptions;
    private _setParentNode: boolean = true;
    private _fallbackToFiles: boolean = false;

    constructor(options: ts.CompilerOptions) {
        this.options = options || {};      
    }

    getStringFile(path: string): any {

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
    getSourceFile(filename: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void): ts.SourceFile {

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

    readFile(fileName: string): string {

        var file = this.getStringFile(fileName);

        if (file) {
            return file;
        }

        if (path.normalize(fileName) === this.getDefaultLibFileName())
            return ts.sys.readFile(path.normalize(fileName));

        return "";
    }

    writeFile(filename: string, data: string, writeByteOrderMark: boolean, onError?: (message: string) => void) {
        this.outputs[filename] = data;
    };

    fileExists(path: string): boolean {
        var file = this.getStringFile(path);
        if (file) {
            return true;
        }
        return false;       
    }

    getNewLine = (): string => ts.sys.newLine;

    useCaseSensitiveFileNames(): boolean {
        return ts.sys.useCaseSensitiveFileNames;
    }

    getCurrentDirectory(): string {
        return ""; //ts.sys.getCurrentDirectory();
    }

    getDefaultLibFileName(): string {       
        var libFile = path.normalize(ts.getDefaultLibFilePath(this.options));
        return libFile;
    }

    getCanonicalFileName(fileName: string): string {
        // if underlying system can distinguish between two files whose names differs only in cases then file name already in canonical form.
        // otherwise use toLowerCase as a canonical form.
        return ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase();
    }

    // Helper functions
    private readFromFile(filename: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void): ts.SourceFile {
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


    addSource(contents: string);
    addSource(name: string, contents: string);
    addSource(nameOrContents, contents?): void {
        var source;

        if (typeof contents == 'undefined')
            source = new StringSource(nameOrContents);
        else
            source = new StringSource(contents, nameOrContents);

        this.sources[source.fileName] = source.contents;
    }


    getSourcesFilenames(): string[] {
        var keys = [];
        var sources = this.sources;
        for (var k in sources)
            if (sources.hasOwnProperty(k))
                keys.push(k);

        return keys;
    }

}

export interface ISource {
    fileName?: string;
    contents?: string;
}

export class StringSource implements ISource {
    private static _counter = 0;

    constructor(public contents: string, public fileName: string = StringSource._nextFilename()) {
    }

    private static _nextFilename() {
        return "input_string" + (++StringSource._counter) + '.ts';
    }

    resetCounter() {
        StringSource._counter = 0;
    }
}

export interface ICompilationResult {
    sources: { [index: string]: string };
    errors: string[];
}

export default class NetPackTypescriptCompiler {

    compileStrings(input, options?: ts.CompilerOptions, onError?: (message) => void): ICompilationResult {

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
            } else
                throw new Error('Invalid value for input argument');
        }
        // dictionary
        else if (typeof input == 'object') {
            for (var k in input) if (input.hasOwnProperty(k))
                sources.push(new StringSource(input[k], k));
        }
        else
            throw new Error('Invalid value for input argument')

        return this._compile(host, sources, options, onError);
    }

    _compile(host: TypescriptCompilerHost, sources: ISource[], options?: ts.CompilerOptions, onError?: (message) => void);
    _compile(host: TypescriptCompilerHost, sources: ISource[], options?: ts.CompilerOptions, onError?: (message) => void);
    _compile(host: TypescriptCompilerHost, sources: ISource[], options?: ts.CompilerOptions, onError?: (message) => void): ICompilationResult {
       
       
        var files;
        sources.forEach(s => host.addSource(s.fileName, s.contents));
        files = host.getSourcesFilenames();

        var program = ts.createProgram(files, options, host);

        let emitResult = program.emit();
        let allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

        let errors = [];
        allDiagnostics.forEach(diagnostic => {
            var errorResult = {};
 
            if(diagnostic.file !== undefined)
            {
                let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                errorResult["File"] = diagnostic.file.fileName;
                errorResult["Line"] = line + 1;
                errorResult["Char"] = character + 1;                
            }
            else
            {
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




