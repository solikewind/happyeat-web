# UI 更新总结

## 本次改动
- **菜单大屏**：独立路由 `/menu-screen`；入口为首页（在售卡角标 + 场景卡片）、菜单工作台工具条「菜单大屏」（新标签、`appPath`）；侧栏已移除该项；页内无品牌标题，仅时间 + 刷新/全屏。
- 工作台 / 菜单管理 / 餐桌管理：去掉页内 `manage-hero-card`；工作台为单卡 `workbench-data-card` 布局；已修复误隐藏 `manage-hero-card` 的全局 `display:none`。


 
 - 点餐台：语音点餐从左上列悬浮角标改为与「搜索菜品」同一行（文字/语音两种录入并列），窄屏自动换行。`OrderDesk.tsx`、`App.css` `.order-desk-search-row`。
- 点餐台购物车：条目区与头部层次区分（标题条浅底描边、列表卡片轻阴影）；缩略图 48px；规格独立多行截断，单价/小计独立一行，避免与数量步进器抢宽导致价格裁切。`OrderDesk.tsx`、`App.css` `.order-desk-cart-*`。
- 点餐台：**三栏顺序调整为「点菜区 | 购物车 | 订单结算」**（原中间为结算、最右为购物车；现符合先加购再结账动线）。栅格仍为 `App.css` `.order-desk-layout` 三列宽不变，仅 DOM 顺序调整；购物车空状态文案同步微调。
- 点餐台：分类 Tab 上方增加菜品名称搜索框（前端过滤当前已加载列表）；有搜索时展示「匹配 n」标签；切换分类时清空搜索；无匹配时 Empty 提示；**加入购物车成功后若当前有搜索词则清空搜索**，便于连续搜下一道菜。样式 `App.css` `.order-desk-menu-search`。
- 餐桌管理：改为与「菜单工作台」相同的左侧分类 + 右侧列表单页布局（`TableWorkspace`）；侧栏维护餐桌分类（新建 / 编辑 / 删除、筛选），右侧合并工具条与桌台表格；去掉原「餐桌分类 / 餐桌列表」双 Tab。样式见 `App.css` 中 `table-manage-shell`、`table-workspace-*`。
- 订单管理：筛选区与统计、订单表合并为同一 `manage-table-card`（`order-manage-data-card` + `order-manage-toolbar`），与菜单工作台列表区一致；根容器增加 `order-manage-shell` 纵向间距与菜单页对齐。
- 菜单管理「菜单工作台」：搜索/新建与统计标签与菜品表合并为同一 `Card`，去掉一层卡片间距；`MenuListTab` 去掉多余 `manage-shell` 包裹；收紧嵌套 Tab 与工具条样式（`menu-manage-shell`、`menu-manage-tab-shell`、`menu-workspace-menu-data-card` 等），让表格区域更靠上。
- 点餐台：菜品卡片不再展示 `menu.description`，仅保留名称、价格、数量与规格等操作区。
- 菜单工作台菜品列表表格：`scroll.x` 与各列 `width` 总和对齐为 1240，压缩描述/规格等列；ID 列 200px、`ellipsis: false` + `table-col-id-text` 全量展示；描述列 120 + `ellipsis.showTitle`。
- 菜单管理细节：嵌套子 Tab 内容区增加顶部留白，避免上方横线与下方圆角卡片贴边，视觉更自然。
- 基础规格库：右侧规格项区改为等高弹性布局、浅色可滚动面板与更密网格卡片，补充说明文案与加载中状态；「编辑该规格组」改为浅色主按钮。
- 菜单分类侧栏拖拽：「菜单工作台」与「分类规格模板」左侧菜单分类列表均支持 `HolderOutlined` 手柄拖动排序，保存 `sort` 至后端（`updateMenuCategory`）。
- 规格与菜单：`src/api/spec.ts` 对接分类规格、规格组、规格项；`types.ts` 补充 `CategorySpec` / `SpecGroup` / `SpecItem` 及 `MenuSpec` 字段。菜单管理改为「菜单工作台 + 分类规格模板 + 基础规格库」嵌套页签：分类规格支持从库批量导入、侧栏选分类与按组聚合展示；菜品弹窗支持引用分类规格、全局规格项与自定义规格组（去重合并提交）；分类编辑弹窗可跳转分类规格。点餐台为三栏（**菜品 | 购物车 | 订单结算**），规格按维度单选。餐桌管理增加头图与页签容器，与后台其他页一致。
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
- 弹窗：统一管理类弹窗的标题区说明、关闭按钮样式、底部按钮宽度与按钮区对齐；补齐 `菜单管理`、`餐桌管理`、`订单管理` 的标题文案与分类弹窗说明卡片。
- 样式：新增/整理 `src/App.css`、`src/index.css` 的全局 UI 规范。

## 涉及文件
- `src/api/spec.ts`、`src/api/types.ts`、`src/api/menu.ts`（菜品 `specs` 结构）。
- `src/pages/MenuManage.tsx`、`src/pages/OrderDesk.tsx`、`src/pages/TableManage.tsx`、`src/App.css`（规格模板与菜单工作台布局、点餐三栏等）。
- `src/App.tsx` 接入 Ant Design 全局主题和中文 locale，统一圆角、主色、表格和布局风格。
- `src/layouts/MainLayout.tsx` 把后台壳层升级成更完整的管理后台结构，增加品牌区、页面标题区、面包屑和更清晰的导航层级。
- `src/pages/Home.tsx` 从简单导航页改成“经营概览 + 快捷入口”，首页会拉取菜单、餐桌、订单的真实统计。
- `src/pages/OrderDesk.tsx`：三栏点餐（菜品区 / 购物车 / 结算与提交），分类 Tab、搜索、语音、规格与 `OrderCartContext` 联动。
- `src/pages/Login.tsx` 统一成品牌化登录页，和后台整体风格保持一致。
- `src/pages/MenuManage.tsx`、`src/pages/TableManage.tsx`、`src/pages/OrderManage.tsx`、`src/pages/Workbench.tsx` 统一成同一套管理页视觉模板。
- `src/pages/MenuManage.tsx`、`src/pages/TableManage.tsx`、`src/pages/OrderManage.tsx` 补充更规整的弹窗表单布局、空状态和表格横向滚动。
- `src/pages/MenuManage.tsx`、`src/pages/TableManage.tsx`、`src/pages/OrderManage.tsx` 统一弹窗标题说明和按钮区样式。
- `src/pages/OrderDesk.tsx` 补充规格标签、数量选择容器和更友好的购物车空状态。
- `src/App.css` 补了一套后台通用视觉样式，包括侧边栏、头部、内容区、卡片、登录页和点餐页的设计语言。
- `src/index.css` 补了一套后台通用视觉样式，包括侧边栏、头部、内容区、卡片、登录页和点餐页的设计语言。

## 验证
- `pnpm exec tsc -b` 通过；`eslint` 针对 `MenuManage.tsx`、`OrderDesk.tsx`、`TableManage.tsx`、`spec.ts` 无告警。
- 全量 `pnpm lint` 仍可能受历史文件影响；若需清零可单独处理 `contexts`、`hooks`、`utils/stt.ts` 等既有问题。

## 后续建议
- 如需继续，可处理语音模块的历史 lint / build 问题。

## 点餐台三栏与后续 App 版（过程记录，便于迁移）

| 区块（从左到右） | 职责 | 技术要点（Web） |
|------------------|------|-----------------|
| `order-desk-main` | 分类 Tab、搜索、菜品卡片、规格、加入购物车 | `listMenus` + `filteredMenus` 前端过滤；`cardSelections` 存每卡数量/规格 |
| `order-desk-cart-pane` | 购物车列表、改数量 | `OrderCartContext`：`cart`、`updateCartQty` |
| `order-desk-summary-pane` | 金额统计、堂食/外带、桌号、`createOrder` 提交 | `orderType`、`tableId`、`handleSubmit` |

**App 版建议**：小屏可改为「上菜区 / 下购物车 + 结算」或 Tab 分步；业务状态与接口与上表一致即可复用。后续迭代本节前补交互稿与接口清单。

## 约定
- 后续只要继续做 UI / 交互 / 样式修改，同步更新本文件。
- **点餐台、订单相关较大交互变更时**，在本文件「本次改动」或上表续写一行，便于做 **App 版** 时对齐。
- 已新增 Cursor 规则：`.cursor/rules/ui-summary-update.mdc`
