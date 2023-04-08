import './style.css'

import { parse } from './hyperscript-transpiler/parser';
import { transpile } from "./hyperscript-transpiler/transpiler";
import { install, run } from "./hyperscript-transpiler/runtime";

install(window)
window.parse = (program: string) => {
  try {
    return parse(program)
  } catch (e) {
    throw new Error(`Error parsing \`${program}\`: ${e}`)
  }
}
window.transpile = (program: string) => {
  const parsed = window.parse(program);
  try {
    return transpile(parsed);
  } catch (e) {
    throw new Error(`Error transpiling \`${program}\`: ${e}`)
  }
}
window.exec = async (program: string, target?: Element) => {
  const transpiled = window.transpile(program);
  try {
    return await run(transpiled, target);
  } catch (e) {
    throw new Error(`Error running \`${program}\`, transpiled \`${transpiled}\`: ${e}`)
  }
}

window.document.addEventListener('DOMContentLoaded', () => {
  const targets = document.querySelectorAll('[_]')
  Array.prototype.forEach.call(targets, (target) => {
    const source = target.getAttribute('_');
    const transpiled = window.transpile(source);
    target.setAttribute('transpiled', transpiled)
    window.exec(source, target)
  })
})
