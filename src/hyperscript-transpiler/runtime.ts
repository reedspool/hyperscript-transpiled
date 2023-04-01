/*
 * Don't know how to solve global's type other than `any`. It needs `____` property
 * to be undefined or erasable when it comes in, but it needs to allow for the
 * addition of that property.
 */
export type InstalledGlobal = {
    next: (start: Element, root: Element, match: string, wrap: boolean) => Element | undefined;
    wait: (ms: number) => Promise<ReturnType<typeof setTimeout>>;
};
export const install = (global: any) => {
    const g: Partial<InstalledGlobal> = global.____ = {}
    // Stolen from _hyperscript
    g.next = function (start, root, match, wrap) {
        var results = root.querySelectorAll(match);
        for (var i = 0; i < results.length; i++) {
            var elt = results[i];
            if (elt.compareDocumentPosition(start) === Node.DOCUMENT_POSITION_PRECEDING) {
                return elt;
            }
        }
        return wrap ? results[0] : undefined;
    }

    g.wait = function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
export const run = (program: string, target?: Element) => {
    return eval(program)(target)
}
