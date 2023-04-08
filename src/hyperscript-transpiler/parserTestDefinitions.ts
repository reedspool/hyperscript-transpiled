export const tests:
    {
        then: string,
        src: string,
        afterParse: { type: string, [key: string]: any },
        afterTransform: "same"
    }[]
    = [
        {
            then: 'it can parse a self reference `me`',
            src: 'me',
            afterParse: { type: "SelfReferenceExpression" },
            afterTransform: "same"
        },
        {
            then: 'it can parse a self reference `I`',
            src: 'I',
            afterParse: { type: "SelfReferenceExpression" },
            afterTransform: "same"
        },
        {
            then: 'it can parse an untargeted style attr expression',
            src: '*color',
            afterParse: { type: "StyleAttrExpression", attr: 'color', target: null },
            afterTransform: "same"
        },
        {
            then: 'it can parse a targeted style attr expression',
            src: '*color of abcd',
            afterParse: { type: "StyleAttrExpression", attr: 'color', target: { type: "IdentifierExpression", next: null, value: "abcd" } },
            afterTransform: "same"
        },
        {
            then: 'it can parse setting a variable to a string',
            src: 'set myColor to "blue"',
            afterParse: { type: "SetExpression", target: { type: "IdentifierExpression", next: null, value: "myColor" }, value: { type: "StringExpression", value: "blue" } },
            afterTransform: "same"
        },
        {
            then: 'it can parse setting an untargeted style attr expression to a string',
            src: 'set *color to "blue"',
            afterParse: { type: "SetExpression", target: { type: "StyleAttrExpression", attr: 'color', target: null }, value: { type: "StringExpression", value: "blue" } },
            afterTransform: "same"
        },
        {
            then: 'it can parse setting a targeted style attr expression to a string',
            src: 'set *color of xxx to "blue"',
            afterParse: { type: "SetExpression", target: { type: "StyleAttrExpression", attr: 'color', target: { type: "IdentifierExpression", next: null, value: "xxx" } }, value: { type: "StringExpression", value: "blue" } },
            afterTransform: "same"
        },
        {
            then: 'it can parse an integer',
            src: '12345',
            afterParse: { type: "NumberExpression", value: '12345' },
            afterTransform: "same"
        },
        {
            then: 'it can parse a float',
            src: '12345.0001',
            afterParse: { type: "NumberExpression", value: '12345.0001' },
            afterTransform: "same"
        },
        {
            then: 'it can parse a seconds duration expression',
            src: '1s',
            afterParse: { type: "SecondsDurationExpression", value: { type: "NumberExpression", value: '1' } },
            afterTransform: "same"
        },
        {
            then: 'it can parse a milliseconds duration expression',
            src: '1000ms',
            afterParse: { type: "MillisecondsDurationExpression", value: { type: "NumberExpression", value: '1000' } },
            afterTransform: "same"
        },
        {
            then: 'it can parse a wait expression',
            src: 'wait 1000ms',
            afterParse: { type: "WaitExpression", duration: { type: "MillisecondsDurationExpression", value: { type: "NumberExpression", value: '1000' } } },
            afterTransform: "same"
        },
        {
            then: 'it can parse a log expression without text',
            src: 'log',
            afterParse: { type: "LogExpression", args: [] },
            afterTransform: "same"
        },
        {
            then: 'it can parse a log command with text',
            src: 'log "hello"',
            afterParse: { type: "LogExpression", args: [{ type: "StringExpression", value: 'hello' }] },
            afterTransform: "same"
        },
        {
            then: 'it can parse two log commands concatenated with `then`',
            src: 'log "hello" then log "hola"',
            afterParse: { type: "CompoundExpression", first: { type: "LogExpression", args: [{ type: "StringExpression", value: 'hello' }] }, next: { type: "LogExpression", args: [{ type: "StringExpression", value: 'hola' }] } },
            afterTransform: "same"
        },
        {
            then: 'it can parse a single-line on-click feature ',
            src: 'on click log "hello"',
            afterParse: { type: "Feature", event: "click", body: [{ type: "LogExpression", args: [{ type: "StringExpression", value: 'hello' }] }] },
            afterTransform: "same"
        },
        {
            then: 'it can parse a multi-line on-click feature ',
            src: 'on click\nlog "hello";\nlog;',
            afterParse: { type: "Feature", event: "click", body: [{ type: "LogExpression", args: [{ type: "StringExpression", value: 'hello' }] }, { type: "LogExpression", args: [] }] },
            afterTransform: "same"
        },
        {
            then: 'it can parse a dollar sign identifier expression ',
            src: '$',
            afterParse: { type: "IdentifierExpression", next: null, value: "$" },
            afterTransform: "same"
        },
        {
            then: 'it can parse a underscore identifier expression ',
            src: '_',
            afterParse: { type: "IdentifierExpression", next: null, next: null, value: "_" },
            afterTransform: "same"
        },
        {
            then: 'it can parse a single-letter identifier expression ',
            src: 'x',
            afterParse: { type: "IdentifierExpression", next: null, value: "x" },
            afterTransform: "same"
        },
        {
            then: 'it can parse a multi-letter identifier expression ',
            src: 'x$_abl',
            afterParse: { type: "IdentifierExpression", next: null, value: "x$_abl" },
            afterTransform: "same"
        },
        {
            then: 'it can parse multi-part identifier expression',
            src: 'first.second',
            afterParse: {
                type: "IdentifierExpression", value: "first",
                next: { type: "IdentifierExpression", next: null, value: "second" }
            },
            afterTransform: "same"
        },
        {
            then: 'it can parse a next expression',
            src: 'next ".clazz"',
            afterParse: { type: "NextExpression", selector: { type: "StringExpression", value: ".clazz" } },
            afterTransform: "same"
        },
        {
            then: 'it can parse a function call expression with no arguments',
            src: 'call myFunc()',
            afterParse: { type: "FunctionCallExpression", name: "myFunc", args: [] },
            afterTransform: "same"
        },
        {
            then: 'it can parse a function call expression with one argument',
            src: 'call func(n)',
            afterParse: { type: "FunctionCallExpression", name: "func", args: [{ type: "IdentifierExpression", next: null, value: "n" }] },
            afterTransform: "same"
        },
        {
            then: 'it can parse a function call expression with multiple arguments',
            src: 'call my_callable(arg1, arg2)',
            afterParse: { type: "FunctionCallExpression", name: "my_callable", args: [{ type: "IdentifierExpression", next: null, value: "arg1" }, { type: "IdentifierExpression", next: null, value: "arg2" }] },
            afterTransform: "same"
        },
        {
            then: 'it can parse a function call expression with a string argument',
            src: 'call func("abcd")',
            afterParse: { type: "FunctionCallExpression", name: "func", args: [{ type: "StringExpression", value: "abcd" }] },
            afterTransform: "same"
        },
        {
            then: 'it can parse a function call expression with a number argument',
            src: 'call func(1)',
            afterParse: { type: "FunctionCallExpression", name: "func", args: [{ type: "NumberExpression", value: "1" }] },
            afterTransform: "same"
        }
    ];
