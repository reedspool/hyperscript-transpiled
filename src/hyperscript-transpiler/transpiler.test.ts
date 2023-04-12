import { describe, it, expect } from 'vitest'
import { parse } from './parser';
import { transpile } from "./transpiler";
const wrap = (text: string) =>
    (fn: Function) =>
        (text2: string, ...args: any[]) =>
            fn(text + text2, ...args)
const given = wrap('Given ')(describe);
const then = wrap('Then ')(it);
const t = (program: string) => {
    let parsed;
    try {
        parsed = parse(program)
    } catch (e) {
        throw new Error(`Error parsing \`${program}\`: ${e}`)
    }
    try {
        return transpile(parsed)
    } catch (e) {
        throw new Error(`Error transpiling \`${program}\`: ${e}`)
    }
}
given("a test suite", () => {
    then('assertions don\'t fail', () => expect(1).toEqual(1))
})
given("a transpiler", () => {
    then("it transpiles", () => {
        expect(typeof transpile, "it provides a transpile function").toEqual("function")
        expect(t(''), "it transpiles an empty program").toMatch(/\(target\)\s*=>/)
        expect(t('3'), "it transpiles an integer expression").toMatch(/3/)
        expect(t('3.14'), "it transpiles a float number expression").toMatch(/3\.14/)
        expect(t('3s'), "it transpiles an integer seconds expression to milliseconds").toMatch(/3.*\*.*1000/)
        expect(t('3.14s'), "it transpiles a float seconds expression to milliseconds").toMatch(/3.14.*\*.*1000/)
        expect(t('5ms'), "it transpiles an integer milliseconds expression").toMatch(/5/)
        expect(t('5.44ms'), "it transpiles a float milliseconds expression").toMatch(/5.44/)
        expect(t('identifier'), "it transpiles an identifier").toMatch(/identifier/)
        expect(t('$A___$'), "it transpiles an interesting identifier").toMatch(/\$A___\$/)
        let program = t('first.second');
        expect(program, "it includes the first part of a dotted identifier").toMatch(/first/)
        expect(program, "it includes the second part of a dotted identifier").toMatch(/second/)
        expect(program, "it includes a complete dotted identifier").toMatch(/first.*\.second/)
        program = t('log "hello" then log "hola"');
        expect(program, "it includes the first log").toMatch(/hello/)
        expect(program, "it includes a separating semi-colon").toMatch(/;/)
        expect(program, "it includes the second log").toMatch(/hola/)
        program = t('wait 1.24s');
        expect(program, "it calls the runtime function").toMatch(/____.wait\(/)
        expect(program, "it includes the duration").toMatch(/1.24/)
        program = t('*backgroundColor');
        expect(program, "it attempts to access the style").toMatch(/backgroundColor/)
        expect(program, "it uses the default target").toMatch(/target\./)
        program = t('*backgroundColor of anotherTarget');
        expect(program, "it accesses the style ").toMatch(/\.style\.backgroundColor/)
        expect(program, "it uses the given target").toMatch(/anotherTarget/)
        program = t('add class "brown" to anotherTarget');
        expect(program, "it references the given class").toMatch(/brown/)
        expect(program, "it mentions class").toMatch(/class/)
        expect(program, "it uses the given target").toMatch(/anotherTarget/)
        program = t('remove class "red" from anotherTarget');
        expect(program, "it references the given class").toMatch(/red/)
        expect(program, "it mentions class").toMatch(/class/)
        expect(program, "it uses the given target").toMatch(/anotherTarget/)
        program = t('next ".clazz"');
        expect(program, "it calls the runtime function").toMatch(/____.next\(/)
        expect(program, "it passes the selector").toMatch(/\.clazz/)
        program = t('set myColor to "blue"');
        expect(program, "it references the variable name").toMatch(/myColor/)
        expect(program, "it uses let to make a local").toMatch(/let\s+myColor/)
        expect(program, "it sets").toMatch(/=/)
        expect(program, "it provides the value").toMatch(/blue/)
        program = t('set *backgroundColor to "blue"');
        expect(program, "it accesses the style ").toMatch(/\.style\.backgroundColor/)
        expect(program, "it uses the default target").toMatch(/target\./)
        expect(program, "it sets").toMatch(/=/)
        expect(program, "it provides the value").toMatch(/blue/)
        expect(t('log'), "it transpiles a log command with no text").toMatch(/console\.log\(\s*\)/)
        expect(t('log "hello"'), "it transpiles a log command with text").toMatch(/console\.log\(.*"hello".*\)/)
        program = t('on click log "hello"');
        expect(program, "it adds an event").toMatch(/target\.addEventListener/)
        expect(program, "it includes a log").toMatch(/console\.log\(.*"hello".*\)/)
        program = t('on click\nlog "hello"');
        expect(program, "it adds an event").toMatch(/target\.addEventListener/)
        expect(program, "it includes a log").toMatch(/console\.log\(.*"hello".*\)/)
        expect(t('me'), "`me` reflects the target").toMatch(/\(?target\)?.*target/)
        expect(t('I'), "`I` reflects the target").toMatch(/\(?target\)?.*target/)
        expect(t('call myFunc()'), "the function name is present").toMatch(/myFunc/)
        expect(t('call myFunc()')).toMatch(/myFunc\s*\(\s*\)/)
        expect(t('call myObj.myFunc()')).toMatch(/myObj.*myFunc\s*\(\s*\)/)
        expect(t('call myFunc(a, b, c)'), "the function is called with arguments").toMatch(/myFunc\s*\(\s*a\s*,\s*b\s*,\s*c\s*\)/)
    })
})
