import { describe, it, expect, vi } from 'vitest'
import { parse } from './parser';
import { transpile } from "./transpiler.js";
import { InstalledGlobal, run } from "./runtime.js";
const {
    fn, spyOn, advanceTimersByTime, useFakeTimers,
    restoreAllMocks, runAllTimersAsync
} = vi;
const wrap = (text: string) =>
    (fn: Function) =>
        (text2: string, ...args: any[]) =>
            fn(text + text2, ...args)
const given = wrap('Given ')(describe);
const exec = async (program: string, target?: Element) => {
    let parsed, transpiled;
    try {
        parsed = parse(program)
    } catch (e) {
        throw new Error(`On PARSE \`${program}\`\nError: ${e}`)
    }
    try {
        transpiled = transpile(parsed)
    } catch (e) {
        throw new Error(`On TRANSPILE \`${program}\`\nError: ${e}`)
    }
    try {
        return await run(transpiled, target);
    } catch (e) {
        throw new Error(`On RUN \`${program}\`\nTranspiled: \`${transpiled}\`\nError: ${e}`)
    }
}

// T is an attempt (doesn't always work) at a wrapper for `node:test`'s test()
// method which includes the offending transpiled code when there is test failure.
// This is presuming that all test failures raise exceptions, which doesn't seem
// to be the case.
// Okay but now we're in expect and describe territory. We need to look at the vitest library and
// how does vitest want us to do these syncronous tests with sinon clearing
// const T = async (t, title, source, target, callback) =>
//     t.test(title, async (t) => {
//         let transpiled
//         try {
//             transpiled = transpile(Parser.parse(source));
//             await callback(t, await run(transpiled, target))
//         } catch (error) {
//             expect.fail(`Failure!\n\nTranspiled: ${transpiled}\n\nError: ${error}`)
//         }
//     })

/* TODO Don't know how to do this without any */
given("a runtime", async () => {
    /**
     * TODO This top-level `it` is required because at least one is required nested under a `describe`
     *      But why am I not just doing it, with a descriptive message, everywhere?! Because it didn't work, and I just want
     *      to get my tests passing before I go back and try to figure out how to do that properly.
     **/
    it('runs programs', async ({ expect }) => {
        expect(await exec(''), 'it runs an empty program').toBeUndefined();
    })
    {
        expect(await exec('3'), 'it returns a JS value for an integer').toEqual(3)
        expect(await exec('2.14'), 'it returns a JS value for a float').toEqual(2.14)
        expect(await exec('3s'), "it returns an integer second value * 1000").toEqual(3000)
        expect(await exec('3.14s'), "it returns an float second value * 1000").toEqual(3140)
        expect(await exec('3ms'), "it returns an integer millisecond value").toEqual(3)
        expect(await exec('3.14ms'), "it returns an float millisecond value").toEqual(3.14)
    }
    // TODO This test is broken - but really it's trying to test the runtime global ____.wait
    //        function which deserves its own tests.
    // {
    //     spyOn(console, 'log').mockImplementation(() => {/*noop*/ })
    //     const waitFn = fn();
    //     const wait: any = (ms: number) => new Promise((resolve) => setTimeout(() => resolve(waitFn(ms)), ms));
    //     let mobal: { ____: Partial<InstalledGlobal> } = global as any
    //     mobal.____ = { wait }
    //     useFakeTimers()
    //     // console.log(transpile(parse('wait 1234ms then log "hello"')))
    //     await exec('wait 1234ms then log "hello"')
    //     expect(console.log).not.toHaveBeenCalled()
    //     advanceTimersByTime(1232);
    //     expect(console.log).not.toHaveBeenCalled()
    //     await runAllTimersAsync()
    //     expect(console.log).toHaveBeenCalledTimes(1)
    //     expect(waitFn).toHaveBeenCalledTimes(1);
    //     expect(waitFn).toHaveBeenNthCalledWith(1, 1234)
    //     restoreAllMocks();
    // }
    {
        const target = {} as Element;
        expect(await exec('me', target), "`me` returns target").toBe(target);
        expect(await exec("I", target), "`I` returns target").toBe(target);
    }
    {
        const target = { style: { backgroundColor: "tomato" } } as unknown as Element;
        expect(await exec('*backgroundColor', target), "it returns a JS value").toEqual("tomato");
    }
    {
        const next = () => ({ style: { fontSize: 3.14 } })
        let mobal: { ____: Partial<InstalledGlobal> } = global as any
        mobal.____ = { next } as any
        global.document = { body: {} } as unknown as Document;
        const target = {} as Element;
        const output = await exec('*fontSize of next ".clazz"', target)
        expect(output, "it returns a JS value").toEqual(3.14);
    }
    {
        let mobal: { ____: InstalledGlobal; document: { body: Element } } = global as any
        mobal.____ = { next: fn() } as any as InstalledGlobal;
        mobal.document = { body: {} as Element };
        const target = {} as Element;
        const output = await exec('next ".clazz"', target)
        expect(output, "it returns an HTML element").toEqual(undefined)
        if (!mobal.____.next) expect.fail("")
        expect(mobal.____.next, "it calls global next function").toHaveBeenCalledTimes(1)
        expect(mobal.____.next, "it calls global next function correctly").toHaveBeenNthCalledWith(1, target, document.body, ".clazz", false)
        restoreAllMocks();
    }
    {
        spyOn(console, 'log').mockImplementation(() => {})
        const output = await exec('log')
        expect(output, "it returns undefined").toEqual(undefined)
        expect(console.log, "it calls console.log").toHaveBeenCalledTimes(1)
        expect(console.log, "it calls console.log with no args").toHaveBeenCalledWith()
        restoreAllMocks();
    }
    {
        spyOn(console, 'log').mockImplementation(() => {})
        const output = await exec('log "hello"')
        expect(output, "it returns undefined").toEqual(undefined)
        expect(console.log, "it calls console.log").toHaveBeenCalledTimes(1)
        expect(console.log, "it calls console.log with no args").toHaveBeenCalledWith("hello")
        restoreAllMocks();
    }
    {
        spyOn(console, 'log').mockImplementation(() => {})
        const output = await exec('log "first" then log "second"')
        expect(output, "it returns undefined").toEqual(undefined)
        expect(console.log, "it calls console.log").toHaveBeenCalledTimes(2)
        expect(console.log, "it calls console.log with the first string").toHaveBeenNthCalledWith(1, "first")
        expect(console.log, "it calls console.log with no args").toHaveBeenNthCalledWith(2, "second")
        restoreAllMocks();
    }
    {
        let mobal: { consoleLog: typeof console.log } = global as any
        const consoleLog = fn();
        mobal.consoleLog = consoleLog;
        const output = await exec('call consoleLog("hello")')
        expect(output, "it returns undefined").toEqual(undefined)
        expect(consoleLog, "it calls the given function").toHaveBeenCalledTimes(1)
        expect(consoleLog, "it passes the right arguments").toHaveBeenNthCalledWith(1, "hello")
        restoreAllMocks();
    }
    {
        const target = { addEventListener: function () {} } as any as Element;
        spyOn(target, "addEventListener");
        const output = await exec('on click log "hello"', target)
        expect(output, "it returns undefined").toEqual(undefined)
        expect(target.addEventListener, "it calls addEventListener").toHaveBeenCalledTimes(1)
        // TODO Below line doesn't work as I was hoping from here:
        //      https://stackoverflow.com/a/52031787
        //      but in this version, calls is just a simple array of arrays apparently.
        //      So instead, going to mock again and return this from the function
        // expect(
        //     target.addEventListener.mock.calls[0].thisValue,
        //     "it calls addEventListener on target")
        //     .toBe(targetSpy)
        restoreAllMocks();
        const target2 = { addEventListener: function () { return this; } } as any as Element;
        spyOn(target2, "addEventListener");
        const output2 = await exec('on click log "hello"', target2)
        expect(output2, "it calls addEventListener on target").toBe(target2)
        expect(target2.addEventListener, "it calls addEventListener").toHaveBeenCalledTimes(1)

        // We want to grab the listener which was added to addEventListener
        //@ts-ignore mock is definitely there, but it's untyped in Vitest unfortunately.
        const [_, listener] = target2.addEventListener.mock.calls[0]
        spyOn(console, 'log').mockImplementation(() => {})
        expect(typeof listener).toEqual("function")
        expect(console.log, "it doesn't call feature body until event listener triggered").not.toHaveBeenCalled()
        listener();
        expect(console.log).toHaveBeenCalledTimes(1)
        restoreAllMocks();
    }
    {
        const target = { addEventListener: function () {} } as any as Element;
        spyOn(target, "addEventListener");
        const output = await exec('on click\nlog "hello"', target)
        expect(output, "it returns undefined").toEqual(undefined)
        expect(target.addEventListener, "it calls addEventListener").toHaveBeenCalledTimes(1)
        // TODO Below line doesn't work as I was hoping from here:
        //      https://stackoverflow.com/a/52031787
        //      but in this version, calls is just a simple array of arrays apparently.
        //      So instead, going to mock again and return this from the function
        // expect(
        //     target.addEventListener.mock.calls[0].thisValue,
        //     "it calls addEventListener on target")
        //     .toBe(targetSpy)
        restoreAllMocks();
        const target2 = { addEventListener: function () { return this; } } as any as Element;
        spyOn(target2, "addEventListener");
        const output2 = await exec('on click log "hello"', target2)
        expect(output2, "it calls addEventListener on target").toBe(target2)
        expect(target2.addEventListener, "it calls addEventListener").toHaveBeenCalledTimes(1)

        // We want to grab the listener which was added to addEventListener
        //@ts-ignore mock is definitely there, but it's untyped in Vitest unfortunately.
        const [_, listener] = target2.addEventListener.mock.calls[0]
        spyOn(console, 'log').mockImplementation(() => {})
        expect(typeof listener).toEqual("function")
        expect(console.log, "it doesn't call feature body until event listener triggered").not.toHaveBeenCalled()
        listener();
        expect(console.log).toHaveBeenCalledTimes(1)
        restoreAllMocks();
    }
    {
        const output = await exec('set msg to "hola"')
        expect(output, "it returns the set value").toEqual("hola")
    }
    {
        spyOn(console, 'log').mockImplementation(() => {})
        const output = await exec('set msg to "hola" then log msg')
        expect(output, "it returns undefined").toEqual(undefined)
        expect(console.log, "it calls console.log").toHaveBeenCalledTimes(1)
        expect(console.log, "it calls console.log with the right args").toHaveBeenCalledWith("hola")
        restoreAllMocks();
    }
});
