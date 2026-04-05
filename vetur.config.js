/**
 * 从仓库根目录打开时，让 Vetur 使用 apps/web-antd 的 tsconfig（含 #/ 别名）。
 * 推荐：卸载 Vetur，只保留 Vue - Official (Volar)；Vetur 对 Vue3 + 别名支持差。
 * @see https://vuejs.github.io/vetur/guide/setup.html#advanced
 */
module.exports = {
  projects: ['./apps/web-antd'],
};
