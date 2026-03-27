# 前端权限矩阵（V1）

> 用于前后端权限联调：角色 -> 页面/按钮 -> API。

## 角色与权限

| 角色 | 角色标识 | 权限点 |
| --- | --- | --- |
| 超级管理员 | `super_admin` | 全部权限 |
| 店长 | `manager` | 全部权限 |
| 收银 | `cashier` | `home:view` `orders:view` `orders:create` `order_desk:view` `order_desk:create` |
| 后厨 | `kitchen` | `home:view` `workbench:view` `workbench:complete` `orders:view` |
| 服务员 | `waiter` | `home:view` `orders:view` `order_desk:view` `order_desk:create` `table:view` |

## 权限点与 API 映射

| 权限点 | 页面/按钮场景 | API（method + path） |
| --- | --- | --- |
| `permission:view` | 权限管理页面访问 | - |
| `home:view` | 首页概览与导航入口 | - |
| `workbench:view` | 工作台订单列表 | `GET /central/v1/workbench/orders` |
| `workbench:complete` | 工作台点击“出单完成” | `PUT /central/v1/order/:id/status` |
| `orders:view` | 订单管理列表/详情 | `GET /central/v1/orders` `GET /central/v1/order/:id` |
| `orders:create` | 订单管理新建订单 | `POST /central/v1/orders` |
| `orders:update_status` | 订单管理切换状态 | `PUT /central/v1/order/:id/status` |
| `order_desk:view` | 点餐台页面加载 | `GET /central/v1/menu/categories` `GET /central/v1/menus` `GET /central/v1/tables` |
| `order_desk:create` | 点餐台点击“提交订单” | `POST /central/v1/orders` |
| `menu:view` | 菜单管理列表/详情 | `GET /central/v1/menu/categories` `GET /central/v1/menus` `GET /central/v1/menu/:id` |
| `menu:edit` | 菜单分类/菜品新增、编辑、删除 | `POST /central/v1/menu/category` `PUT /central/v1/menu/category/:id` `DELETE /central/v1/menu/category/:id` `POST /central/v1/menus` `PUT /central/v1/menu/:id` `DELETE /central/v1/menu/:id` |
| `table:view` | 餐桌管理列表/详情 | `GET /central/v1/table/categories` `GET /central/v1/tables` `GET /central/v1/table/:id` |
| `table:edit` | 餐桌分类/餐桌新增、编辑、删除 | `POST /central/v1/table/category` `PUT /central/v1/table/category/:id` `DELETE /central/v1/table/category/:id` `POST /central/v1/tables` `PUT /central/v1/table/:id` `DELETE /central/v1/table/:id` |

## 代码位置

- 权限定义和角色矩阵：`src/auth/permissions.ts`
- 权限可视化管理页面：`src/pages/PermissionManage.tsx`
- 路由级校验：`src/App.tsx`
- 导航级校验：`src/layouts/MainLayout.tsx`
- 按钮级示例（工作台）：`src/pages/Workbench.tsx`

## 页面化配置说明

- 当前权限页采用“远端优先，本地回退”：
  - 优先读取后端：`GET /central/v1/rbac/role-permissions`
  - 更新单角色：`PUT /central/v1/rbac/role-permissions/:role`
  - 重置配置：`POST /central/v1/rbac/role-permissions/reset`
- 如果后端返回 `404`，前端自动回退到浏览器 `localStorage`（`happyeat_role_permissions`）。
- 回退模式下页面会显示提示条，便于联调识别。

## 后端 Casbin 对齐建议

- 建议将上面“权限点”作为前端语义层，后端将每个权限点映射为多条 `obj + act` 策略。
- 当前登录返回的 JWT 已携带 `role`，前端已据此做页面与按钮控制。
- 联调时以“页面可见 + API 可访问”双重通过为验收标准。
