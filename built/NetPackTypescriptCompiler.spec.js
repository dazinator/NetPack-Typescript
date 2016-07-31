/// <reference path="../typings/index.d.ts" />
"use strict";
const compilerhost_1 = require("./compilerhost");
const fs = require("fs");
describe("NetPackTypescriptCompiler", () => {
    describe("compileStrings", () => {
        it("successfully transpiles typescript to strings", () => {
            // Arrange
            var classAFileContents = fs.readFileSync('testFiles/classa.ts', "utf-8");
            var classBFileContents = fs.readFileSync('testFiles/classb.ts', "utf-8");
            var args = '--module Amd -t es6 --outFile test.js --inlineSourceMap';
            var files = {
                "ClassA.ts": classAFileContents,
                "ClassB.ts": classBFileContents
            };
            var compileErrors = [];
            var errorHandler = function (err) {
                compileErrors.push(err);
            };
            let sut = new compilerhost_1.default();
            // Act
            let result = sut.compileStrings(files, args, null, errorHandler);
            // Assert
            expect(result).toEqual("Hello World");
        });
    });
});
//# sourceMappingURL=NetPackTypescriptCompiler.spec.js.map