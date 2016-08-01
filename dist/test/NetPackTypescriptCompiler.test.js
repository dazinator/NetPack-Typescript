/// <reference path="../../typings/index.d.ts" />
"use strict";
var compilerhost_1 = require("../compilerhost");
var fs = require("fs");
var chai_1 = require('chai');
describe("NetPackTypescriptCompiler", function () {
    describe("compileStrings", function () {
        it("successfully transpiles typescript to strings", function () {
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
            var sut = new compilerhost_1["default"]();
            // Act
            var result = sut.compileStrings(files, args, null, errorHandler);
            // Assert
            chai_1.expect(result.errors.length).to.equal(0);
        });
    });
});
//# sourceMappingURL=NetPackTypescriptCompiler.test.js.map