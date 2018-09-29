"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compilerhost_1 = require("../compilerhost");
const fs = require("fs");
const chai_1 = require("chai");
describe("NetPackTypescriptCompiler", () => {
    describe("compileStrings", () => {
        it("successfully transpiles typescript to strings", () => {
            // Arrange
            var classAFileContents = fs.readFileSync('testFiles/moduleA/classa.ts', "utf-8");
            var classBFileContents = fs.readFileSync('testFiles/moduleB/classb.ts', "utf-8");
            // var args = '--module Amd -t es5 --outFile test.js --inlineSourceMap --traceResolution ';
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
            let sut = new compilerhost_1.default();
            let options = {
                "inlineSourceMap": false,
                "inlineSources": false,
                "module": 2,
                "noImplicitAny": true,
                "sourceMap": true,
                "target": 1,
                "outFile": "test.js",
            };
            // Act
            let result = sut.compileStrings(files, options, errorHandler);
            // Assert
            chai_1.expect(result.errors.length).to.equal(0);
            chai_1.expect(result.sources["test.js"]).is.not.undefined;
        });
        it("errors when invalid typescripts", () => {
            // Arrange
            var classAFileContents = "this is .gibberish";
            //var args = '--module Amd -t es5 --outFile test.js --inlineSourceMap --traceResolution ';
            var webRoot = "testFiles";
            var filePathA = webRoot + "/ModuleA/ClassA.ts";
            var files = {};
            files[filePathA] = classAFileContents;
            var compileErrors = [];
            var errorHandler = function (err) {
                compileErrors.push(err);
            };
            let sut = new compilerhost_1.default();
            let options = {
                "inlineSourceMap": false,
                "inlineSources": false,
                "module": 1,
                "noImplicitAny": true,
                "sourceMap": true,
                "target": 1,
                "outFile": "test.js"
            };
            //  var options = 
            // Act
            let result = sut.compileStrings(files, options, errorHandler);
            // Assert
            chai_1.expect(result.errors.length).not.equal(0);
        });
    });
});
//# sourceMappingURL=compiler.test.js.map