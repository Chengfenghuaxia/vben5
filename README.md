# 管理后台前端

本仓库：[github.com/Chengfenghuaxia/vben5](https://github.com/Chengfenghuaxia/vben5)。

基于上游 [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin) 裁剪，仅保留 **Ant Design Vue** 主应用与本地 Mock 服务。

## 环境

- Node：`^20.19.0 || ^22.18.0 || ^24.0.0`
- pnpm：`>=10`

## 克隆

```bash
git clone https://github.com/Chengfenghuaxia/vben5.git
```

## 常用命令

```bash
pnpm install
pnpm dev:antd
```

构建：

```bash
pnpm build:antd
```

## 测试账号（Mock）

| 用户名 | 密码   | 角色   |
|--------|--------|--------|
| vben   | 123456 | 超级管理员 |
| admin  | 123456 | 管理员 |
| jack   | 123456 | 普通用户 |

对接真实后端：修改 `apps/web-antd/.env.production` 中的 `VITE_GLOB_API_URL`，并将 `apps/web-antd/.env.development` 里 `VITE_NITRO_MOCK` 设为 `false`（或按项目方式关闭 Mock）。
