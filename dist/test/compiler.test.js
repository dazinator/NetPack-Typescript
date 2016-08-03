/// <reference path="../../typings/index.d.ts" />
"use strict";
var compilerhost_1 = require("../compilerhost");
var fs = require("fs");
var chai_1 = require('chai');
describe("NetPackTypescriptCompiler", function () {
    describe("compileStrings", function () {
        it("successfully transpiles typescript to strings", function () {
            // Arrange
            var classAFileContents = fs.readFileSync('testFiles/moduleA/classa.ts', "utf-8");
            var classBFileContents = fs.readFileSync('testFiles/moduleB/classb.ts', "utf-8");
            var args = '--module Amd -t es5 --outFile test.js --inlineSourceMap --traceResolution ';
            var webRoot = "testFiles";
            var filePathA = webRoot + "/ModuleA/ClassA.ts";
            var filePathB = webRoot + "/ModuleB/ClassB.ts";
            var files = {};
            files[filePathA] = classAFileContents;
            files[filePathB] = classBFileContents;
            var compileErrors = [];
            var errorHandler = function (err) {
                compileErrors.push(err);
            };
            var sut = new compilerhost_1["default"]();
            // Act
            var result = sut.compileStrings(files, args, null, errorHandler);
            // Assert
            chai_1.expect(result.errors.length).to.equal(0);
            chai_1.expect(result.sources["test.js"]).is.not.undefined;
        });
        it("errors when invalid typescripts", function () {
            // Arrange
            var classAFileContents = "this is .gibberish";
            var args = '--module Amd -t es5 --outFile test.js --inlineSourceMap --traceResolution ';
            var webRoot = "testFiles";
            var filePathA = webRoot + "/ModuleA/ClassA.ts";
            var files = {};
            files[filePathA] = classAFileContents;
            var compileErrors = [];
            var errorHandler = function (err) {
                compileErrors.push(err);
            };
            var sut = new compilerhost_1["default"]();
            // Act
            var result = sut.compileStrings(files, args, null, errorHandler);
            // Assert
            chai_1.expect(result.errors.length).not.equal(0);
        });
    });
});
//# sourceMappingURL=compiler.test.js.map