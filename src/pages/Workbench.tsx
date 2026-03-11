import { useEffect, useState, useCallback } from 'react'
import { Typography, Table, Button, Tag, message, Select, Space } from 'antd'
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
    <div>
      <Typography.Title level={4}>工作台</Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        待处理订单（待支付/已支付/制作中）。出单完成后点击「出单」将状态改为已完成。
      </Typography.Text>
      <Space style={{ marginBottom: 16 }}>
        <span>状态筛选：</span>
        <Select
          style={{ width: 150 }}
          placeholder="全部状态"
          allowClear
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value)
            setPage(1) // 切换筛选时重置到第一页
          }}
          options={[
            { label: '全部', value: undefined },
            ...Object.entries(STATUS_MAP).map(([k, v]) => ({ label: v, value: k })),
          ]}
        />
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={orders}
        columns={[
          { title: '订单号', dataIndex: 'order_no', width: 140 },
          { title: '类型', dataIndex: 'order_type', width: 70, render: (t: string) => ORDER_TYPE_MAP[t] ?? t },
          { title: '状态', dataIndex: 'status', width: 90, render: (s: string) => <Tag>{STATUS_MAP[s] ?? s}</Tag> },
          {
            title: '创建日期',
            dataIndex: 'create_at',
            width: 160,
            render: (ts: number | undefined) => (ts ? new Date(ts * 1000).toLocaleString('zh-CN') : '-'),
          },
          {
            title: '桌号',
            dataIndex: 'table_code',
            width: 120,
            render: (code: string, record: Order) => {
              if (!code) return '-'
              const category = record.table_category
              return category ? `${category}-${code}` : code
            },
          },
          { title: '金额', dataIndex: 'total_amount', width: 80, render: (v: number) => `¥${v?.toFixed(2) ?? '0.00'}` },
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
    </div>
  )
}
