import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Empty, Pagination, Select, Space, Tag, Typography, message } from 'antd'
import { CheckOutlined, ClockCircleOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import type { Order } from '../api/types'
import { listWorkbenchOrders, updateOrderStatus } from '../api/order'
import { useAuth } from '../contexts/AuthContext'

const ORDER_TYPE_MAP: Record<string, string> = {
  dine_in: '堂食',
  takeaway: '打包外带',
}

const STATUS_MAP: Record<string, string> = {
  created: '待支付',
  paid: '已支付',
  preparing: '制作中',
  completed: '已完成',
  cancelled: '已取消',
}

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
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listWorkbenchOrders({ current: page, pageSize: WORKBENCH_PAGE_SIZE, status: statusFilter })
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

  const preparingCount = useMemo(() => orders.filter((item) => item.status === 'preparing').length, [orders])
  const pageAmount = useMemo(() => orders.reduce((sum, item) => sum + asNumber(item.total_amount), 0), [orders])
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / WORKBENCH_PAGE_SIZE)), [total])
  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div className="manage-shell workbench-shell">
      <Card className="order-desk-filter-card">
        <div className="manage-filter-bar">
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
              options={Object.entries(STATUS_MAP).map(([value, label]) => ({ value, label }))}
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
          <Tag color="orange">
            优先处理 已支付 / 制作中
          </Tag>
        </div>
      </Card>

      <div className="compact-summary-inline">
        <Tag color="blue">待处理总数 {total}</Tag>
        <Tag color="purple">本页制作中 {preparingCount}</Tag>
        <Tag color="gold">本页金额 ¥{pageAmount.toFixed(2)}</Tag>
      </div>

      <div className="workbench-card-grid">
        {orders.length === 0 && !loading ? (
          <Card className="workbench-table-card">
            <Empty description="暂无待处理订单" />
          </Card>
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
                        {asNumber(order.create_at)
                          ? new Date(asNumber(order.create_at) * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                          : '--:--'}
                      </span>
                    </div>
                    <span className={`workbench-status-pill ${order.order_type === 'dine_in' ? 'is-dine-in' : 'is-takeaway'}`}>
                      {ORDER_TYPE_MAP[asText(order.order_type, '')] ?? asText(order.order_type)}
                    </span>
                    <span className={`workbench-status-pill workbench-status-pill-state is-${asText(order.status, 'unknown')}`}>
                      {STATUS_MAP[asText(order.status, '')] ?? asText(order.status)}
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
                    {order.status !== 'completed' && order.status !== 'cancelled' ? (
                      <Button type="primary" icon={<CheckOutlined />} onClick={() => handleComplete(order.id)} disabled={!canComplete}>
                        出单完成
                      </Button>
                    ) : (
                      <Tag color="success">已完成</Tag>
                    )}
                  </div>
                </Space>
              </Card>
            )
          })
        )}
      </div>

      <Card className="manage-panel-card">
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
      </Card>
    </div>
  )
}
