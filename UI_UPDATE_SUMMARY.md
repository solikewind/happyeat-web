# UI 更新总结

## 本次改动
- 餐桌平面图：新页面 `/table-map`（侧栏「餐桌平面图」、首页门店配置入口），画布网格上拖拽桌台对齐厅面（需 `table:edit`），布局存 `localStorage`；有待处理订单的桌台高亮并显示角标，点击抽屉看订单摘要；约 45s 自动刷新。样式见 `App.css` `.floor-map-*`。
- 首页：重做 Hero（渐变光晕、双指标卡、动效强调待跟进单）、四格数据卡带图标与顶色条、图表区标题与合计样式、快捷入口按「前厅 / 后厨 / 配置」分组与卡片顶边色、底部贴士区替代原 Alert；Hero 主标题改为「经营全景一览」并控制单行展示（窄屏允许折行）；配套 `App.css` 首页样式与暗色适配。
- 认证：JWT 过期或无法识别角色时清会话并回登录页，避免误进首页再出现 403；已知角色无本页权限仍显示无权限页。
- 全局：统一 `Ant Design` 主题、后台壳层、卡片/按钮/表格风格。
- 布局：重做 `src/layouts/MainLayout.tsx`，补充品牌区、页面标题区、导航描述。
- 首页：重做 `src/pages/Home.tsx`，改为概览统计 + 快捷入口。
- 点餐页：重做 `src/pages/OrderDesk.tsx`，改为菜品区 + 结算区双栏布局，强化购物车、语音状态、桌号选择。
- 登录页：重做 `src/pages/Login.tsx`，统一品牌视觉。
- 管理页：统一 `菜单管理`、`餐桌管理`、`订单管理`、`工作台` 的头图、统计卡、筛选区和表格容器。
- 细节：压低分类统计视觉权重，优化弹窗表单排版、表格空状态、点餐卡片层级。
- 样式：新增/整理 `src/App.css`、`src/index.css` 的全局 UI 规范。

## 涉及文件
- `src/App.tsx` 接入 Ant Design 全局主题和中文 locale，统一圆角、主色、表格和布局风格。
- `src/layouts/MainLayout.tsx` 把后台壳层升级成更完整的管理后台结构，增加品牌区、页面标题区、面包屑和更清晰的导航层级。
- `src/pages/Home.tsx` 从简单导航页改成“经营概览 + 快捷入口”，首页会拉取菜单、餐桌、订单的真实统计。
- `src/pages/OrderDesk.tsx` 重做成左侧菜品浏览、右侧订单结算的结构，强化了分类筛选、语音状态、购物车、金额统计和堂食桌号选择体验。
- `src/pages/Login.tsx` 统一成品牌化登录页，和后台整体风格保持一致。
- `src/pages/MenuManage.tsx`、`src/pages/TableManage.tsx`、`src/pages/OrderManage.tsx`、`src/pages/Workbench.tsx` 统一成同一套管理页视觉模板。
- `src/pages/MenuManage.tsx`、`src/pages/TableManage.tsx`、`src/pages/OrderManage.tsx` 补充更规整的弹窗表单布局、空状态和表格横向滚动。
- `src/pages/OrderDesk.tsx` 补充规格标签、数量选择容器和更友好的购物车空状态。
- `src/App.css` 补了一套后台通用视觉样式，包括侧边栏、头部、内容区、卡片、登录页和点餐页的设计语言。
- `src/index.css` 补了一套后台通用视觉样式，包括侧边栏、头部、内容区、卡片、登录页和点餐页的设计语言。

## 验证
- 已检查：本次修改文件无新增 IDE lint 报错。
- 终端 lint 本轮未成功重跑完成，但当前改动文件的 IDE 检查正常。
- `pnpm lint` 仍失败：剩余为项目原有历史问题，集中在 `contexts`、`hooks`、`utils/stt.ts`。
- `pnpm build` 失败：主要是语音相关历史 TypeScript 问题，未在本次处理范围内。

## 后续建议
- 如需继续，可处理语音模块的历史 lint / build 问题。

## 约定
- 后续只要继续做 UI / 交互 / 样式修改，同步更新本文件。
- 已新增 Cursor 规则：`.cursor/rules/ui-summary-update.mdc`
