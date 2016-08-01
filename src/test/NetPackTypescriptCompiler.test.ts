/// <reference path="../../typings/index.d.ts" />

import NetPackTypescriptCompiler from "../compilerhost";
import * as fs from "fs";

import { expect } from 'chai';

describe("NetPackTypescriptCompiler", () => {

    describe("compileStrings", () => {

        it("successfully transpiles typescript to strings", () => {

            // Arrange
            var classAFileContents = fs.readFileSync('testFiles/classa.ts', "utf-8");
            var classBFileContents = fs.readFileSync('testFiles/classb.ts', "utf-8");
            var args = '--module Amd -t ES5 --outFile test.js --inlineSourceMap';
            var files = {
                "ClassA.ts": classAFileContents,
                "ClassB.ts": classBFileContents
            };
            var compileErrors = [];
            var errorHandler = function (err) {
                compileErrors.push(err);
            };

            let sut = new NetPackTypescriptCompiler()

            // Act
            let result = sut.compileStrings(files, args, null, errorHandler);
            
            // Assert
             expect(result.errors.length).to.equal(0);
           
        });
    });
});