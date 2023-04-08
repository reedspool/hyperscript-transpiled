export type TreeNode = {
    type: string;
} & { [key in string]: any }

export const transpile = (tree: TreeNode) => {
    let contents = ___(tree);
    if (contents.match(/^\s*$/)) contents = "/* noop */undefined";
    return `async (target) => { let last = undefined; ${contents} ; return Promise.resolve(last); }`;
}

export const ___ = (tree: TreeNode, opts?: Partial<TranspileFnOptions>) => {
    if (!tree) throw new Error("No tree passed to transpile")
    if (!typesToTranspileFns[tree.type]) throw new Error(`No transpile fn for type '${tree.type}'`)
    return typesToTranspileFns[tree.type](tree, opts);
}

// Hint: The structure of these sub-trees is exactly what we returned for it in grammar.pegjs
// Which is also the same structure as tested in parser.test.js
export type TranspileFnOptions = { leftHand: boolean }
export type TranspileFn = (tree: TreeNode, opts?: Partial<TranspileFnOptions>) => string;
const defaultOpts: TranspileFnOptions = { leftHand: false };
export const typesToTranspileFns:
    Record<string, TranspileFn> = {
    "EmptyProgram": () => '',
    "Feature": (tree) => `(last = target.addEventListener('${tree.event}', async () => { ${typesToTranspileFns["CommandList"](tree.body)} }))`,
    "CompoundExpression": ({ first, next }) => `${___(first)};${___(next)}`,
    "StyleAttrExpression": ({ attr, target }, { leftHand } = defaultOpts) => `${leftHand ? '' : '(last = '}${target ? ___(target) : 'target'}.style.${attr}${leftHand ? '' : ')'}`,
    "SetExpression": ({ target, value }) =>
        target.type == "IdentifierExpression"
            ? `${target.next ? '' : 'let '}${___(target)} = ${___(value)}`
            : target.type == "StyleAttrExpression"
                ? `${___(target, { leftHand: true })} = ${___(value)}`
                : `Should have failed to parse set expression for ${target.type}`,
    "NumberExpression": ({ value }) => `(last = ${value})`,
    "SecondsDurationExpression": ({ value }) => `(last = (${___(value)} * 1000))`,
    "MillisecondsDurationExpression": ({ value }) => `${___(value)}`,
    "WaitExpression": ({ duration }) => `(last = await ____.wait(${___(duration)}))`,
    "NextExpression": ({ selector }) => `(last = ____.next(target, document.body, ${___(selector)}, false))`,
    "LogExpression": ({ args }) => `(last = console.log(${args.length > 0 ? args.map(___).join(", ") : ""}))`,
    "CommandList": (array) => array.map(___).join(';'),
    "SelfReferenceExpression": ({}) => `(last = target)`,
    "FunctionCallExpression": ({ name, args }) => `last = ${___(name)}(${args.map(___).join(", ")})`,
    "IdentifierExpression":
        ({ value, next }) => `${value}${next ? next.type === "IdentifierExpression"
            ? `.${___(next)}`
            : `Should have failed to parse identifier part ${next}`
            : ''}`,
    "StringExpression": ({ value }) => `(last = "${value}")`
}
