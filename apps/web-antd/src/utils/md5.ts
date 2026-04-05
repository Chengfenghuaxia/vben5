/**
 * 内置 js-md5@0.8.3 实现（MIT）。该脚本在浏览器 ESM 下挂到 `globalThis.md5`，无 `export default`，故在此再导出。
 * @see https://github.com/emn178/js-md5
 */
import './md5-impl.js';

type Md5Fn = (message: string) => string;

const g = globalThis as typeof globalThis & { md5?: Md5Fn };

if (typeof g.md5 !== 'function') {
  throw new Error('[md5] js-md5 未挂载到 globalThis，请检查 md5-impl.js');
}

const md5: Md5Fn = g.md5;

export default md5;
