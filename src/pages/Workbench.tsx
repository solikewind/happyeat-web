import { useEffect, useState, useCallback } from 'react'
import { Button, Card, Col, Row, Select, Statistic, Table, Tag, Typography, message } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import type { Order } from '../api/types'
import { listWorkbenchOrders, updateOrderStatus } from '../api/order'

const ORDER_TYPE_MAP: Record<string, string> = { dine_in: '堂食', takeaway: '打包' }
const STATUS_MAP: Record<string, string> = {
  created: '待支付',
  paid: '已支付',
  preparing: '制作中',
  completed: '已完成',
  cancelled: '已取消',
}

export default function Workbench() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | undefined>()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listWorkbenchOrders({ current: page, pageSize: 10, status: statusFilter })
      setOrders(res.orders)
      setTotal(res.total)
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  const handleComplete = async (id: number) => {
    try {
      await updateOrderStatus(id, 'completed')
      message.success('已标记为出单完成')
      load()
    } catch {
      message.error('操作失败')
    }
  }

  return (
    <div className="manage-shell">
      <Card className="workbench-hero-card">
        <div className="workbench-hero-grid">
          <div>
            <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
              工作台
            </Typography.Title>
            <Typography.Text type="secondary">
              聚合待处理订单，面向后厨或前台快速完成出单。重点关注待支付、已支付和制作中的订单。
            </Typography.Text>
          </div>
          <div className="manage-highlight-list">
            <div className="manage-highlight-item">
              <Typography.Text type="secondary">操作说明</Typography.Text>
              <Typography.Title level={5} style={{ margin: '6px 0 0' }}>
                点击“出单”后会将订单状态更新为已完成
              </Typography.Title>
            </div>
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="manage-stat-card">
            <Statistic title="待处理总数" value={total} suffix="单" />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="manage-stat-card">
            <Statistic title="当前页制作中" value={orders.filter((item) => item.status === 'preparing').length} suffix="单" />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="manage-stat-card">
            <Statistic title="当前页金额" value={orders.reduce((sum, item) => sum + (item.total_amount || 0), 0)} precision={2} prefix="¥" />
          </Card>
        </Col>
      </Row>

      <Card className="manage-panel-card">
        <div className="manage-filter-bar">
          <div className="manage-filter-group">
            <Select
              style={{ width: 160 }}
              placeholder="全部状态"
              allowClear
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
              options={[
                { label: '全部', value: undefined },
                ...Object.entries(STATUS_MAP).map(([k, v]) => ({ label: v, value: k })),
              ]}
            />
          </div>
        </div>
      </Card>

      <Card className="workbench-table-card">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={orders}
          columns={[
            { title: '订单号', dataIndex: 'order_no', width: 160 },
            { title: '类型', dataIndex: 'order_type', width: 90, render: (t: string) => <Tag color={t === 'dine_in' ? 'blue' : 'orange'}>{ORDER_TYPE_MAP[t] ?? t}</Tag> },
            { title: '状态', dataIndex: 'status', width: 100, render: (s: string) => <Tag color={s === 'preparing' ? 'processing' : 'gold'}>{STATUS_MAP[s] ?? s}</Tag> },
            {
              title: '创建日期',
              dataIndex: 'create_at',
              width: 180,
              render: (ts: number | undefined) => (ts ? new Date(ts * 1000).toLocaleString('zh-CN') : '-'),
            },
            {
              title: '桌号',
              dataIndex: 'table_code',
              width: 120,
              render: (code: string, record: Order) => {
                if (!code) return '-'
                const category = record.table_category
                return <Tag color="cyan">{category ? `${category}-${code}` : code}</Tag>
              },
            },
            { title: '金额', dataIndex: 'total_amount', width: 100, render: (v: number) => <Tag color="red">¥{v?.toFixed(2) ?? '0.00'}</Tag> },
            {
              title: '明细',
              dataIndex: 'items',
              render: (items: Order['items']) =>
                items?.length
                  ? items.map((i, idx) => (
                      <div key={idx}>{i.menu_name} x{i.quantity} ¥{i.amount?.toFixed(2)}</div>
                    ))
                  : '-',
            },
            {
              title: '操作',
              width: 100,
              render: (_, r: Order) =>
                r.status !== 'completed' && r.status !== 'cancelled' ? (
                  <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleComplete(r.id)}>
                    出单
                  </Button>
                ) : (
                  <Tag color="green">已完成</Tag>
                ),
            },
          ]}
          pagination={{
            current: page,
            pageSize: 10,
            total,
            showTotal: (t) => `共 ${t} 条`,
            onChange: setPage,
          }}
        />
      </Card>
    </div>
  )
}
