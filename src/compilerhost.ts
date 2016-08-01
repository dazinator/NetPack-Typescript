/// <reference path="../typings/index.d.ts" />


import * as ts from "typescript";
import * as path from "path";


export class TypescriptCompilerHost implements ts.CompilerHost {

    private _sources: ts.Map<string> = {};
    private _outputs: ts.Map<string> = {};
    public options: ts.CompilerOptions;
    private _setParentNode: boolean = true;
    private _fallbackToFiles: boolean = false;

    constructor(options: ts.CompilerOptions) {
        this.options = options || {};
        // this.options.defaultLibFilename = this.options.defaultLibFilename || '';
    }

    shallowClone = (obj: any): ts.Map<string> => {
        var clone: ts.Map<string> = {};
        for (var k in obj)
            if (obj.hasOwnProperty(k)) {
                clone[k] = obj[k];
            }
        return clone;
    }

    sources = (): ts.Map<string> => {
        return this.shallowClone(this._sources);
    }

     outputs = (): ts.Map<string> =>  {
      return this.shallowClone(this._outputs);
    }

    // get sources(): ts.Map<string> {
    //     return this.shallowClone(this._sources);
    // }

    // get outputs(): ts.Map<string> {
    //     return this.shallowClone(this._outputs);
    // }

    // Implementing CompilerHost interface
    getSourceFile(filename: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void): ts.SourceFile {
        if (path.normalize(filename) === this.getDefaultLibFileName())
            return this.readFromFile(filename, languageVersion, onError);

        if (this._sources[filename])
            return ts.createSourceFile(filename, this._sources[filename], languageVersion, true);

        if (this._fallbackToFiles)
            return this.readFromFile(filename, languageVersion, onError);

        return undefined;
    }

    readFile(fileName: string): string {
        if (this._sources[fileName])
            return this._sources[fileName];

        if (path.normalize(fileName) === this.getDefaultLibFileName())
            return ts.sys.readFile(path.normalize(fileName));

        return "";
    }

    writeFile(filename: string, data: string, writeByteOrderMark: boolean, onError?: (message: string) => void) {
        this._outputs[filename] = data;
    };

    fileExists(path: string): boolean {
        return this.sources.hasOwnProperty(path);
    }

    getNewLine = (): string => ts.sys.newLine;

    useCaseSensitiveFileNames(): boolean {
        return ts.sys.useCaseSensitiveFileNames;
    }

    getCurrentDirectory(): string {
        return  ""; //ts.sys.getCurrentDirectory();
    }

    getDefaultLibFileName(): string {
        //var libes6File = path.normalize(__dir ts.getDefaultLibFilePath(this.options));
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

        this._sources[source.fileName] = source.contents;
    }


    getSourcesFilenames(): string[] {
        var keys = [];
        var sources = this.sources();
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

    compileStrings(input, tscArgs?, options?: ts.CompilerOptions, onError?: (message) => void): ICompilationResult {

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

        return this._compile(host, sources, tscArgs, options, onError);
    }

    _compile(host: TypescriptCompilerHost, sources: ISource[], tscArgs: string, options?: ts.CompilerOptions, onError?: (message) => void);
    _compile(host: TypescriptCompilerHost, sources: ISource[], tscArgs: string[], options?: ts.CompilerOptions, onError?: (message) => void);
    _compile(host: TypescriptCompilerHost, sources: ISource[], tscArgs?, options?: ts.CompilerOptions, onError?: (message) => void): ICompilationResult {

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
            sources: host.outputs(),
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

        function formatError(diagnostic: ts.Diagnostic) {
            var output = "";
            if (diagnostic.file) {
                var loc = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                output += diagnostic.file.fileName + "(" + loc.line + "," + loc.character + "): ";
            }
            var category = ts.DiagnosticCategory[diagnostic.category];
            output += category + " TS" + diagnostic.code + ": " + diagnostic.messageText + ts.sys.newLine;
            return output;
        }
    }

}



