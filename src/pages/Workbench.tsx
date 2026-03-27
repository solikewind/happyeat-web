import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Empty, Pagination, Select, Space, Tag, Typography, message } from 'antd'
import { CheckOutlined, ClockCircleOutlined } from '@ant-design/icons'
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

export default function Workbench() {
  const { can } = useAuth()
  const canComplete = can('workbench:complete')
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | undefined>()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listWorkbenchOrders({ current: page, pageSize: 12, status: statusFilter })
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

  const handleComplete = async (id: number) => {
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

  const preparingCount = useMemo(() => orders.filter((item) => item.status === 'preparing').length, [orders])
  const pageAmount = useMemo(() => orders.reduce((sum, item) => sum + asNumber(item.total_amount), 0), [orders])

  return (
    <div className="manage-shell">
      <Card className="manage-panel-card">
        <div className="manage-summary-strip">
          <Tag color="blue" className="manage-summary-pill">
            待处理总数 {total}
          </Tag>
          <Tag color="gold" className="manage-summary-pill">
            本页制作中 {preparingCount}
          </Tag>
          <Tag color="geekblue" className="manage-summary-pill">
            本页金额 ¥{pageAmount.toFixed(2)}
          </Tag>
        </div>
      </Card>

      <Card className="manage-panel-card">
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
          </div>
          <Tag color="orange" className="manage-summary-pill">
            优先处理 已支付 / 制作中
          </Tag>
        </div>
      </Card>

      <div className="workbench-card-grid">
        {orders.length === 0 && !loading ? (
          <Card className="workbench-table-card">
            <Empty description="暂无待处理订单" />
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} loading={loading} className="workbench-order-card">
              <Space direction="vertical" size={14} style={{ width: '100%' }}>
                <div className="workbench-order-topline">
                  <div>
                    <Typography.Text type="secondary">订单号</Typography.Text>
                    <Typography.Title level={5} style={{ margin: '4px 0 0' }}>
                      {asText(order.order_no)}
                    </Typography.Title>
                  </div>
                  <div className="workbench-order-headside">
                    <div className="workbench-amount-chip">
                      <span className="workbench-amount-currency">¥</span>
                      <span className="workbench-amount-value">{asNumber(order.total_amount).toFixed(2)}</span>
                    </div>
                    <div className="workbench-status-strip">
                      <span className={`workbench-status-pill ${order.order_type === 'dine_in' ? 'is-dine-in' : 'is-takeaway'}`}>
                        {ORDER_TYPE_MAP[asText(order.order_type, '')] ?? asText(order.order_type)}
                      </span>
                      <span
                        className={`workbench-status-pill workbench-status-pill-state is-${asText(order.status, 'unknown')}`}
                      >
                        {STATUS_MAP[asText(order.status, '')] ?? asText(order.status)}
                      </span>
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
                  <div
                    className={`workbench-meta-chip workbench-meta-chip-location ${
                      order.table_code ? 'is-dine-in' : 'is-takeaway'
                    }`}
                  >
                    <span className="workbench-location-text">
                      {order.table_code
                        ? `${order.table_category ? `${asText(order.table_category, '')}-` : ''}${asText(order.table_code)}`
                        : '外带订单'}
                    </span>
                  </div>
                </div>

                <div className="workbench-order-items">
                  {(Array.isArray(order.items) ? order.items : []).map((item, index) => (
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
                </div>

                <div className="workbench-order-footer">
                  <Typography.Text type="secondary">备注：{asText(order.remark, '无')}</Typography.Text>
                  {order.status !== 'completed' && order.status !== 'cancelled' ? (
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={() => handleComplete(order.id)}
                      disabled={!canComplete}
                    >
                      出单完成
                    </Button>
                  ) : (
                    <Tag color="success">已完成</Tag>
                  )}
                </div>
              </Space>
            </Card>
          ))
        )}
      </div>

      <Card className="manage-panel-card">
        <Pagination
          current={page}
          pageSize={12}
          total={total}
          showSizeChanger={false}
          showTotal={(count) => `共 ${count} 条`}
          onChange={setPage}
        />
      </Card>
    </div>
  )
}
