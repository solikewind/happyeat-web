# ID 约定与结账单加单问题（前端索引）

完整说明（含后端、与 vega 对比、Bug 根因与修复）见：

**[happyeat/docs/id-conventions-and-settlement-notes.md](../../happyeat/docs/id-conventions-and-settlement-notes.md)**

## 前端速查

- 业务 ID 类型：**`string`**（见 `src/api/types.ts`）
- 边界转换：`src/api/order.ts` 的 `normalizeOrder` / `normalizeOptionalId`
- 结账单 API：`src/api/settlement.ts`
- 结账单页面：`src/pages/SettlementManage.tsx`
- **禁止**在页面里直接比较未 normalize 的 API 响应；**禁止**把 `0` / `"0"` 当成有效外键 ID
