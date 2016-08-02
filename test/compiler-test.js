"use strict";
const compilerhost = require("../dist/compilerhost");
const fs = require("fs");
const chai = require('chai');
describe("NetPackTypescriptCompiler", () => {
    describe("compileStrings", () => {
        it("successfully transpiles typescript to strings", () => {
            // Arrange
            var classAFileContents = fs.readFileSync('testFiles/moduleA/classa.ts', "utf-8");
            var classBFileContents = fs.readFileSync('testFiles/moduleB/classb.ts', "utf-8");
            var args = '--module Amd -t es5 --outFile test.js --inlineSourceMap --traceResolution --baseUrl testFiles ';
           
           var webRoot = "testFiles";
           var filePathA = webRoot + "/ModuleA/ClassA.ts";
           var filePathB = webRoot + "/ModuleB/ClassB.ts";
           
            var files = {
                
            };
            files[filePathA] = classAFileContents;
             files[filePathB] = classBFileContents;

            var compileErrors = [];
            var errorHandler = function (err) {
                compileErrors.push(err);
            };
            let sut = new compilerhost.default();
            // Act
            let result = sut.compileStrings(files, args, null, errorHandler);
            // Assert
            chai.expect(result.errors.length).to.equal(0);
            chai.expect(result.sources["test.js"]).is.not.undefined;
        });
    });
});
