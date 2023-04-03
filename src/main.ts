import './style.css'

import { parse } from './hyperscript-transpiler/parser';
import { transpile } from "./hyperscript-transpiler/transpiler";
import { install, run } from "./hyperscript-transpiler/runtime";

install(window)
window.exec = async (program: string, target?: Element) => {
  let parsed, transpiled;
  try {
    parsed = parse(program)
  } catch (e) {
    throw new Error(`Error parsing \`${program}\`: ${e}`)
  }
  try {
    transpiled = transpile(parsed)
  } catch (e) {
    throw new Error(`Error transpiling \`${program}\`: ${e}`)
  }
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
    const transpiled = transpile(parse(source));
    target.setAttribute('transpiled', transpiled)
    run(transpiled, target)
  })
})
