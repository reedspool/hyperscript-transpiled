import { describe, it, expect } from 'vitest'
import * as Parser from './parser.cjs';
import { tests } from "./parserTestDefinitions"
const wrap = (text: string) =>
    (fn: Function) =>
        (text2: string, ...args: any[]) =>
            fn(text + text2, ...args)
const given = wrap('Given ')(describe), then = wrap('Then ')(it);
given("a test suite", () => {
    then('assertions don\'t fail', () => expect(1).toEqual(1))
    then('it provides a parse function', () => expect(typeof Parser.parse).toEqual('function'))
})

given("a parser", () => {
    tests.forEach(({ then, src, afterParse }) => {
        it(then, () => expect(Parser.parse(src)).toEqual(afterParse))
    })
});
