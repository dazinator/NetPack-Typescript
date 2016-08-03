# NetPackTypescriptCompiler
A typescript compiler written for NodeJS that trasnpiles in memory, for use with NetPack.

Open with VS Code.

```
npm install
```

To debug the tests, launch VS Code debugger with "Run mocha" selected.

To run tests from command line:

```
mocha dist/test
```

All source code is written in typescript within the `src` directory, and is transpiled to the `dist` folder
when you run a build in vs code (ctrl + shift + b).