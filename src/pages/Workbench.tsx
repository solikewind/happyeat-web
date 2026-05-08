import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Empty, Form, Input, InputNumber, Modal, Pagination, Select, Space, Spin, Tag, Typography, message } from 'antd'
import { CheckOutlined, ClockCircleOutlined, EditOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import type { Menu, Order } from '../api/types'
import { listWorkbenchOrders, updateOrder, updateOrderStatus } from '../api/order'
import { listMenus } from '../api/menu'
import { useAuth } from '../contexts/AuthContext'
import { normOrderStatus, ORDER_STATUS_LABEL, ORDER_TYPE_LABEL } from '../utils/orderStatus'

const asText = (value: unknown, fallback = '-') => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

const asNumber = (value: unknown) => (typeof value === 'number' ? value : Number(value) || 0)
const WORKBENCH_PAGE_SIZE = 5
const WORKBENCH_ITEMS_PREVIEW_COUNT = 5

export default function Workbench() {
  const { can } = useAuth()
  const canComplete = can('workbench:complete')
  const canEditOrder = can('orders:update')
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set())
  const [editOpen, setEditOpen] = useState(false)
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [menus, setMenus] = useState<Menu[]>([])
  const [editForm] = Form.useForm()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listWorkbenchOrders({
        current: page,
        pageSize: WORKBENCH_PAGE_SIZE,
        status: statusFilter,
      })
      setOrders(Array.isArray(res?.orders) ? res.orders : [])
      setTotal(Number(res?.total) || 0)
    } catch {
      message.error('加载工作台订单失败')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  const handleComplete = async (id: string) => {
    if (!canComplete) {
      message.warning('当前账号没有出单权限')
      return
    }
    try {
      await updateOrderStatus(id, 'completed')
      message.success('订单已标记为完成')
      load()
    } catch {
      message.error('更新订单状态失败')
    }
  }

  const toggleOrderItems = (orderId: string) => {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  const openEdit = async (order: Order) => {
    if (!canEditOrder) {
      message.warning('当前账号没有编辑订单权限')
      return
    }
    try {
      const res = await listMenus({ current: 1, pageSize: 500 })
      const menuList = Array.isArray(res?.menus) ? res.menus : []
      const menuNameToId = new Map(menuList.map((item) => [item.name, item.id]))
      const legacyMenus: Menu[] = []
      editForm.resetFields()
      editForm.setFieldsValue({
        remark: order.remark ?? '',
        items: (order.items ?? []).map((item, index) => {
          const foundId = menuNameToId.get(item.menu_name)
          if (foundId) {
            return {
              menu_id: foundId,
              quantity: asNumber(item.quantity),
              spec_info: asText(item.spec_info, ''),
            }
          }
          const legacyId = `legacy:${order.id}:${index}`
          legacyMenus.push({
            id: legacyId,
            name: item.menu_name,
            price: asNumber(item.unit_price),
            category_id: '',
            created_at: '',
            updated_at: '',
          })
          return {
            menu_id: legacyId,
            quantity: asNumber(item.quantity),
            spec_info: asText(item.spec_info, ''),
          }
        }),
      })
      setMenus([...menuList, ...legacyMenus])
      setEditingOrderId(order.id)
      setEditOpen(true)
    } catch {
      message.error('加载订单编辑数据失败')
    }
  }

  const handleEditOk = async () => {
    if (!canEditOrder) return
    if (!editingOrderId) return
    const values = await editForm.validateFields()
    const formItems = (values.items ?? []).filter((item: { menu_id?: string; quantity?: number }) => item?.menu_id && item?.quantity)
    if (!formItems.length) {
      message.error('请至少保留一道菜品')
      return
    }
    try {
      await updateOrder(editingOrderId, {
        items: formItems.map((item: { menu_id: string; quantity: number; spec_info?: string }) => ({
          menu_id: item.menu_id,
          quantity: asNumber(item.quantity),
          spec_info: item.spec_info || undefined,
        })),
        remark: values.remark || undefined,
      })
      message.success('订单已更新')
      setEditOpen(false)
      load()
    } catch {
      message.error('更新订单失败')
    }
  }

  const preparingCount = useMemo(
    () => orders.filter((item) => normOrderStatus(item.status) === 'preparing').length,
    [orders],
  )
  const pageAmount = useMemo(() => orders.reduce((sum, item) => sum + asNumber(item.total_amount), 0), [orders])
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / WORKBENCH_PAGE_SIZE)), [total])
  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div className="manage-shell workbench-shell">
      <Card className="manage-table-card workbench-data-card">
        <div className="workbench-toolbar">
          <div className="manage-filter-bar workbench-filter">
            <div className="manage-filter-group">
              <Select
                allowClear
                style={{ minWidth: 180 }}
                placeholder="按状态筛选"
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value)
                  setPage(1)
                }}
                options={Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => ({ value, label }))}
              />
              <Button
                type={statusFilter === 'completed' ? 'primary' : 'default'}
                onClick={() => {
                  setStatusFilter((prev) => (prev === 'completed' ? undefined : 'completed'))
                  setPage(1)
                }}
              >
                已完成
              </Button>
            </div>
            <Tag color="orange">优先处理 已支付 / 制作中</Tag>
          </div>
          <div className="compact-summary-inline compact-summary-inline--dense">
            <Tag color="blue">待处理总数 {total}</Tag>
            <Tag color="purple">本页制作中 {preparingCount}</Tag>
            <Tag color="gold">本页金额 ¥{pageAmount.toFixed(2)}</Tag>
          </div>
        </div>

        <div className="workbench-card-grid">
          {loading && orders.length === 0 ? (
            <div className="workbench-grid-empty">
              <Spin />
            </div>
          ) : orders.length === 0 ? (
            <div className="workbench-grid-empty">
              <Empty description="暂无待处理订单" />
            </div>
          ) : (
            orders.map((order) => {
            const locationText = order.table_code
              ? `${order.table_category ? `${asText(order.table_category, '')}-` : ''}${asText(order.table_code)}`
              : '外带订单'

            return (
              <Card key={order.id} loading={loading} className="workbench-order-card">
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                  <div className="workbench-order-topline">
                    <div>
                      <Typography.Text type="secondary">订单号</Typography.Text>
                      <Typography.Title level={5} className="workbench-order-no" style={{ margin: '4px 0 0' }}>
                        {asText(order.order_no)}
                      </Typography.Title>
                    </div>
                    <div className="workbench-order-headside">
                      <div
                        className={`workbench-meta-chip workbench-meta-chip-location workbench-key-location ${
                          order.table_code ? 'is-dine-in' : 'is-takeaway'
                        }`}
                      >
                        <span className="workbench-location-text">{locationText}</span>
                      </div>
                      <div className="workbench-amount-chip">
                        <span className="workbench-amount-currency">¥</span>
                        <span className="workbench-amount-value">{asNumber(order.total_amount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="workbench-order-meta-row">
                    <div className="workbench-meta-chip">
                      <ClockCircleOutlined />
                      <span>
                        {order.created_at
                          ? new Date(order.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                          : '--:--'}
                      </span>
                    </div>
                    <span className={`workbench-status-pill ${order.order_type === 'dine_in' ? 'is-dine-in' : 'is-takeaway'}`}>
                      {ORDER_TYPE_LABEL[asText(order.order_type, '')] ?? asText(order.order_type)}
                    </span>
                    <span className={`workbench-status-pill workbench-status-pill-state is-${normOrderStatus(order.status) || 'unknown'}`}>
                      {ORDER_STATUS_LABEL[normOrderStatus(order.status)] ?? asText(order.status)}
                    </span>
                  </div>

                  <div className="workbench-order-items">
                    {(() => {
                      const items = Array.isArray(order.items) ? order.items : []
                      const isExpanded = expandedOrderIds.has(order.id)
                      const visibleItems = isExpanded ? items : items.slice(0, WORKBENCH_ITEMS_PREVIEW_COUNT)
                      const hiddenCount = Math.max(0, items.length - visibleItems.length)

                      return (
                        <>
                          {visibleItems.map((item, index) => (
                            <div key={`${order.id}-${asText(item.menu_name, 'item')}-${index}`} className="workbench-order-item">
                              <div>
                                <Typography.Text strong>{asText(item.menu_name)}</Typography.Text>
                                <Typography.Text type="secondary" className="workbench-order-item-note">
                                  {asText(item.spec_info, '默认规格')}
                                </Typography.Text>
                              </div>
                              <div className="workbench-order-item-side">
                                <Typography.Text>x{asNumber(item.quantity)}</Typography.Text>
                                <Typography.Text type="secondary">¥{asNumber(item.amount).toFixed(2)}</Typography.Text>
                              </div>
                            </div>
                          ))}
                          {items.length > WORKBENCH_ITEMS_PREVIEW_COUNT && (
                            <Button type="link" className="workbench-items-toggle" onClick={() => toggleOrderItems(order.id)}>
                              {isExpanded ? '收起菜品' : `还有 ${hiddenCount} 项，点击展开`}
                            </Button>
                          )}
                        </>
                      )
                    })()}
                  </div>

                  <div className="workbench-order-footer">
                    <Typography.Text type="secondary">备注：{asText(order.remark, '无')}</Typography.Text>
                    <Space size={8}>
                      {(normOrderStatus(order.status) === 'created' ||
                        normOrderStatus(order.status) === 'paid' ||
                        normOrderStatus(order.status) === 'preparing') && (
                        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(order)} disabled={!canEditOrder}>
                          编辑
                        </Button>
                      )}
                      {normOrderStatus(order.status) === 'completed' ? (
                        <Tag color="success">已完成</Tag>
                      ) : normOrderStatus(order.status) === 'cancelled' ? (
                        <Tag>已取消</Tag>
                      ) : normOrderStatus(order.status) === 'created' ? (
                        <Tag color="warning">待支付 · 收款后再出餐</Tag>
                      ) : (
                        <Button type="primary" icon={<CheckOutlined />} onClick={() => handleComplete(order.id)} disabled={!canComplete}>
                          出单完成
                        </Button>
                      )}
                    </Space>
                  </div>
                </Space>
              </Card>
            )
          })
          )}
        </div>

        <Modal
          className="manage-modal"
          title="编辑订单"
          open={editOpen}
          onOk={handleEditOk}
          onCancel={() => setEditOpen(false)}
          okText="保存"
          cancelText="取消"
          okButtonProps={{ disabled: !canEditOrder }}
          centered
          width={760}
        >
          <Form form={editForm} layout="vertical" style={{ marginTop: 8 }}>
            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={3} placeholder="选填" />
            </Form.Item>
            <Form.Item label="菜品明细" style={{ marginBottom: 0 }}>
              <Form.List name="items">
                {(fields, { add, remove }) => (
                  <div className="inline-editor-list">
                    {fields.map(({ key, name, ...rest }) => (
                      <div key={key} className="inline-editor-row">
                        <Form.Item {...rest} name={[name, 'menu_id']} label="菜品" rules={[{ required: true, message: '请选择菜品' }]}>
                          <Select
                            placeholder="选择菜品"
                            options={menus.map((menu) => ({ label: `${menu.name} ¥${asNumber(menu.price).toFixed(2)}`, value: menu.id }))}
                          />
                        </Form.Item>
                        <Form.Item {...rest} name={[name, 'spec_info']} label="规格备注">
                          <Input placeholder="如：少辣、加饭" />
                        </Form.Item>
                        <Form.Item {...rest} name={[name, 'quantity']} label="数量" rules={[{ required: true, message: '请输入数量' }]}>
                          <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                        <Button type="text" danger onClick={() => remove(name)}>
                          删除
                        </Button>
                      </div>
                    ))}
                    <Button type="dashed" onClick={() => add({ quantity: 1 })} block>
                      + 添加菜品
                    </Button>
                  </div>
                )}
              </Form.List>
            </Form.Item>
          </Form>
        </Modal>

        <div className="workbench-pager-bar">
          <Space style={{ width: '100%', justifyContent: 'space-between' }} align="center">
            <Button icon={<LeftOutlined />} disabled={!canPrev} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
              上一页
            </Button>
            <Pagination
              current={page}
              pageSize={WORKBENCH_PAGE_SIZE}
              total={total}
              showSizeChanger={false}
              showTotal={(count) => `共 ${count} 条`}
              onChange={setPage}
            />
            <Button icon={<RightOutlined />} disabled={!canNext} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
              下一页
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  )
}
