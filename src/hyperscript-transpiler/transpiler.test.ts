import { describe, it, expect } from 'vitest'
import * as Parser from './parser.cjs';
import { transpile } from "./transpiler";
const wrap = (text: string) =>
    (fn: Function) =>
        (text2: string, ...args: any[]) =>
            fn(text + text2, ...args)
const given = wrap('Given ')(describe);
const when = wrap('When ')(it);
const then = wrap('Then ')(it);
const match = (transpiled: string, regex: RegExp) => expect(transpiled).toMatch(regex);
const t = (program: string) => transpile(Parser.parse(program))
const tMatches = (program: string, regex: RegExp) => () => match(t(program), regex);
given("a test suite", () => {
    then('assertions don\'t fail', () => expect(1).toEqual(1))
})
given("a transpiler", () => {
    then(
        "it provides a transpile function",
        () => expect(typeof transpile).toEqual("function"))
    then(
        "it transpiles an empty program",
        tMatches('', /\(target\)\s*=>/))
    when("it transpiles a integer expression", tMatches('3', /3/));
    when("it transpiles a float number expression", tMatches('3.14', /3\.14/));
    when("it transpiles a integer seconds expression to milliseconds", tMatches('3s', /\(\s*3\s*\*\s*1000\)/));
    when("it transpiles a float seconds expression to milliseconds", tMatches('3.14s', /\(\s*3.14\s*\*\s*1000\)/));
    when("it transpiles a integer milliseconds expression", tMatches('5ms', /5/));
    when("it transpiles a float milliseconds expression", tMatches('5.44ms', /5.44/));
    when("it transpiles a compound expression joined by `then`", () => {
        const program = t('log "hello" then log "hola"');
        then("it includes the first log", () => match(program, /hello/))
        then("it includes a separating comma", () => match(program, /,/))
        then("it includes the second log", () => match(program, /hola/))
    });
    when("it transpiles a wait expression", () => {
        const program = t('wait 1.24s');
        then("it calls the runtime function", () => match(program, /____.wait\(/))
        then("it includes the duration", () => match(program, /1.24/))
    });
    when("it transpiles an untargeted style attr expression", () => {
        const program = t('*backgroundColor');
        then("it attempts to access the style", () => match(program, /backgroundColor/))
        then("it uses the default target", () => match(program, /target\./))
    });
    when("it transpiles a targeted style attr expression", () => {
        const program = t('*backgroundColor of anotherTarget');
        then("it accesses the style ", () => match(program, /\.style\.backgroundColor/))
        then("it uses the given target", () => match(program, /anotherTarget/))
    });
    when("it transpiles a next expression", () => {
        const program = t('next ".clazz"');
        then("it calls the runtime function", () => match(program, /____.next\(/))
        then("it passes the selector", () => match(program, /\.clazz/))
    });
    when("it transpiles setting a variable to a string", () => {
        const program = t('set myColor to "blue"');
        then("it references the variable name", () => match(program, /myColor/))
        then("it sets", () => match(program, /=/))
        then("it provides the value", () => match(program, /blue/))
    });
    when("it transpiles setting an untargeted style attr expression to a string", () => {
        const program = t('set *backgroundColor to "blue"');
        then("it accesses the style ", () => match(program, /\.style\.backgroundColor/))
        then("it uses the default target", () => match(program, /target\./))
        then("it sets", () => match(program, /=/))
        then("it provides the value", () => match(program, /blue/))
    });
    then(
        "it transpiles a log command with no text",
        tMatches('log', /console\.log\(\)/))
    then(
        "it transpiles a log command with text",
        tMatches('log "hello"', /console\.log\("hello"\)/))
    when("it transpiles a single-line on-click feature", () => {
        const program = t('on click log "hello"');
        then("it adds an event", () => match(program, /target\.addEventListener/))
        then("it includes a log", () => match(program, /console\.log\("hello"\)/))
    })
    when("it transpiles a multi-line on-click feature", () => {
        const program = t('on click\nlog "hello"');
        then("it adds an event", () => match(program, /target\.addEventListener/))
        then("it includes a log", () => match(program, /console\.log\("hello"\)/))
    })
    when("it transpiles a self reference", () => {
        then("`me` reflects the target", () => match(t('me'), /\(?target\)?/))
        then("`I` reflects the target", () => match(t('I'), /\(?target\)?/))
    })
    when("it transpiles a function call expression", () => {
        then("the function name is present", () => match(t('call myFunc()'), /myFunc/))
        then("the function is called", () => match(t('call myFunc()'), /myFunc\s*\(\s*\)/))
        then("the function is called with arguments", () => match(t('call myFunc(a, b, c)'), /myFunc\s*\(\s*a\s*,\s*b\s*,\s*c\s*\)/))
    })
})
