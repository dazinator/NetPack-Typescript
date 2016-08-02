# NetPackTypescriptCompiler
A typescript compiler written for NodeJS that trasnpiles in memory, for use with NetPack.

Open with VS Code.

To run tests, from command line:

```
cd dist
mocha
```

To debug tests, start host with:
```
npm run-script test.debug
```

Then in VS Code, from debug menu, select "Debug unit tests" from drop down and hit play. That will attach to the process.

All source code is written in typescript within the `src` directory, and is transpiled to the dist folder when you run a build in vs code (ctrl + shift + b).

You may need to install global dependencies and typings:


```
typings install dt~mocha --global
typings install dt~chai
typings install dt~typescript
typings install dt~node
```

dependencies are mocha and chai.
