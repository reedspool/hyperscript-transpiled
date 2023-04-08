import { TreeNode } from "./hyperscript-transpiler/transpiler";

/* From https://stackoverflow.com/questions/12709074/how-do-you-explicitly-set-a-new-property-on-window-in-typescript#comment110581801_12709880 */
export {};

declare global {
    interface Window {
        parse(program: string): TreeNode;
        transpile(program: string): string;
        exec(program: string, target?: Element): Promise<any>;
    }
}
