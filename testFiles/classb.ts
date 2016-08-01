///<reference path="classa.ts" />
import {ClassA} from "../testFiles/classa";

export class ClassB {
    constructor(public another: string) { }
    doSomething() {
        // return ""<h1>"" + this.greeting + ""</h1>"";
    }
};

var classB = new ClassB("Hello, world!");
classB.doSomething();

var classA = new ClassA("Hello, world!");
classA.doSomething();