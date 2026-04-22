/** 与后端 happyeat API 对齐的通用类型（基于 happyeat.json） */

export interface LoginReq {
  username: string
  password: string
}

export interface LoginReply {
  access_token: string
  expire: number
}

/** 菜单分类（与后端 MenuCategory 一致） */
export interface MenuCategory {
  id: string
  name: string
  description?: string
  sort?: number
  created_at?: string
  updated_at?: string
}

/** 兼容旧名 */
export type Category = MenuCategory

export interface MenuSpec {
  spec_item_id?: string
  category_spec_id?: string
  source?: 'category' | 'library' | 'custom'
  spec_type?: string
  spec_value?: string
  price_delta: number
  sort?: number
}

export interface Menu {
  id: string
  name: string
  price: number
  category_id: string
  description?: string
  image?: string
  specs?: MenuSpec[]
  created_at: string
  updated_at: string
}

export interface CategorySpec {
  id: string
  category_id: string
  spec_item_id?: string
  spec_type: string
  spec_value: string
  price_delta: number
  sort: number
  created_at?: string
  updated_at?: string
}

export interface SpecGroup {
  id: string
  name: string
  sort: number
  created_at?: string
  updated_at?: string
}

export interface SpecItem {
  id: string
  spec_group_id: string
  name: string
  default_price: number
  created_at?: string
  updated_at?: string
}

/** 餐桌分类 */
export interface TableCategory {
  id: string
  name: string
  description?: string
  create_at?: number
}

export interface Table {
  id: string
  code: string
  status: string
  capacity: number
  category_id: string
  qr_code?: string
  create_at: number
  update_at: number
}

export interface OrderItem {
  menu_name: string
  quantity: number
  unit_price: number
  amount: number
  spec_info?: string
}

export interface Order {
  id: string
  order_no: string
  order_type: string
  /** 经 `api/order` 列表/详情/创建返回后为小写（created / paid / …），与展示用键一致 */
  status: string
  total_amount: number
  /** 实收金额（与后端 `actual_amount` 一致，单位同 total_amount） */
  actual_amount?: number
  table_id?: string
  table_code?: string // 桌号（堂食时显示，外带为空）
  table_category?: string // 餐桌类别（如大厅、包间）
  remark?: string
  items?: OrderItem[]
  /** 后端 RFC3339 UTC 字符串 */
  created_at?: string
  updated_at?: string
}
