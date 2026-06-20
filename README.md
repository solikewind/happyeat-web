# HappyEat 管理后台（前端）

与 HappyEat 后端配套的 React 前端，技术栈：Vite + React 18 + TypeScript + Ant Design + React Router + Axios。

## 功能范围

- 登录与权限控制
- 首页经营概览
- 点餐台、工作台、订单管理
- 菜单、规格、餐桌管理
- 结账单管理
- 销售统计
- 菜单大屏

## 开发

```bash
# 安装依赖（若未安装）
pnpm install

# 启动开发服务，默认 http://localhost:5173
pnpm dev
```

请先启动后端服务（默认 `http://localhost:8888`），并在 `.env.development` 中配置：

```env
VITE_API_BASE=http://localhost:8888/central/v1
```

## 构建

```bash
pnpm build
```

产物在 `dist/`，可部署到任意静态托管。

## 目录说明

- `src/api/`：接口封装（client、types、auth）
- `docs/`：设计说明（如 [权限矩阵](docs/permission-matrix.md)、[ID 约定](docs/id-conventions-and-settlement-notes.md)、[待优化清单](docs/TODO-optimizations.md)）
- `src/contexts/`：全局状态（如 AuthContext）
- `src/layouts/`：布局（侧栏 + 顶栏）
- `src/pages/`：页面（登录、菜单、餐桌、订单、工作台）

接口约定以项目根目录的 `happyeat.json`（Swagger）为准，后端变更后请同步该文件。

## 配套项目

- 后端服务：`../happyeat`
- 移动端 App：`../happyeat-app`
