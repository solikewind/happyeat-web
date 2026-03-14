import { useCallback, useEffect, useState } from 'react'
import {
  Card,
  Col,
  Empty,
  Typography,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Tag,
  Descriptions,
  Row,
  Statistic,
} from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import type { Order, Menu, Table as TTable } from '../api/types'
import { listOrders, createOrder, getOrder, updateOrderStatus } from '../api/order'
import { listMenus } from '../api/menu'
import { listTables } from '../api/table'

const ORDER_TYPE_MAP: Record<string, string> = { dine_in: '堂食', takeaway: '打包外带' }
const STATUS_MAP: Record<string, string> = {
  created: '待支付',
  paid: '已支付',
  preparing: '制作中',
  completed: '已完成',
  cancelled: '已取消',
}

export default function OrderManage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [orderTypeFilter, setOrderTypeFilter] = useState<string | undefined>()
  const [modalOpen, setModalOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [menus, setMenus] = useState<Menu[]>([])
  const [tables, setTables] = useState<TTable[]>([])
  const [form] = Form.useForm()

  const openDetail = async (id: number) => {
    try {
      const { order } = await getOrder(id)
      setDetailOrder(order)
      setDetailOpen(true)
    } catch {
      message.error('获取订单详情失败')
    }
  }

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await updateOrderStatus(id, status)
      message.success('状态已更新')
      load()
      if (detailOrder?.id === id) {
        setDetailOrder((o) => (o ? { ...o, status } : null))
      }
    } catch {
      message.error('更新失败')
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listOrders({
        current: page,
        pageSize: 10,
        status: statusFilter,
        order_type: orderTypeFilter,
      })
      setOrders(Array.isArray(res?.orders) ? res.orders : [])
      setTotal(res?.total ?? 0)
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, orderTypeFilter])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = async () => {
    form.resetFields()
    form.setFieldsValue({ order_type: 'dine_in', items: [{}] })
    try {
      const [menuRes, tableRes] = await Promise.all([
        listMenus({ current: 1, pageSize: 500 }),
        listTables({ current: 1, pageSize: 500 }),
      ])
      setMenus(Array.isArray(menuRes?.menus) ? menuRes.menus : [])
      const tbls = Array.isArray(tableRes?.tables) ? tableRes.tables : []
      setTables(tbls.filter((t) => t.status === 'idle' || t.status === 'using'))
      setModalOpen(true)
    } catch {
      message.error('加载菜单/餐桌失败')
    }
  }

  const onOk = async () => {
    const values = await form.validateFields()
    const orderType = values.order_type
    const items = (values.items ?? []).filter((i: { menu_id?: number; quantity?: number }) => i?.menu_id != null && (i?.quantity ?? 0) > 0)
    if (items.length === 0) {
      message.error('请至少添加一道菜品')
      return
    }
    const menuMap = Object.fromEntries(menus.map((m) => [m.id, m]))
    let totalAmount = 0
    const bodyItems = items.map((i: { menu_id: number; quantity: number; spec_info?: string }) => {
      const menu = menuMap[i.menu_id]
      const unitPrice = menu ? menu.price : 0
      const amount = unitPrice * i.quantity
      totalAmount += amount
      return {
        menu_name: menu?.name ?? '',
        quantity: i.quantity,
        unit_price: unitPrice,
        spec_info: i.spec_info || undefined,
      }
    })
    try {
      await createOrder({
        order_type: orderType,
        table_id: orderType === 'dine_in' ? values.table_id : undefined,
        items: bodyItems,
        total_amount: Math.round(totalAmount * 100) / 100,
        remark: values.remark || undefined,
      })
      message.success('创建成功')
      setModalOpen(false)
      load()
    } catch {
      message.error('创建失败')
    }
  }

  return (
    <div className="manage-shell">
      <Card className="manage-hero-card">
        <div className="manage-hero-grid">
          <div>
            <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
              订单管理
            </Typography.Title>
            <Typography.Text type="secondary">
              统一查看订单状态、金额、桌台信息和明细，并支持快速创建与更新状态。
            </Typography.Text>
          </div>
          <div className="manage-highlight-list">
            <div className="manage-highlight-item">
              <Typography.Text type="secondary">当前目标</Typography.Text>
              <Typography.Title level={5} style={{ margin: '6px 0 0' }}>
                优先关注待支付、已支付、制作中订单
              </Typography.Title>
            </div>
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="manage-stat-card">
            <Statistic title="订单总数" value={total} suffix="单" />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="manage-stat-card">
            <Statistic title="当前页待处理" value={orders.filter((item) => ['created', 'paid', 'preparing'].includes(item.status)).length} suffix="单" />
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
              allowClear
              placeholder="按状态筛选"
              value={statusFilter ?? undefined}
              onChange={setStatusFilter}
              style={{ minWidth: 140 }}
              options={Object.entries(STATUS_MAP).map(([k, v]) => ({ label: v, value: k }))}
            />
            <Select
              allowClear
              placeholder="按类型筛选"
              value={orderTypeFilter ?? undefined}
              onChange={setOrderTypeFilter}
              style={{ minWidth: 140 }}
              options={Object.entries(ORDER_TYPE_MAP).map(([k, v]) => ({ label: v, value: k }))}
            />
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建订单</Button>
        </div>
      </Card>

      <Card className="manage-table-card">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={orders}
          scroll={{ x: 1180 }}
          locale={{
            emptyText: <Empty className="table-empty-state" description="暂无订单记录" />,
          }}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 70 },
            { title: '订单号', dataIndex: 'order_no', width: 160, ellipsis: true },
            {
              title: '类型',
              dataIndex: 'order_type',
              width: 100,
              render: (t: string) => {
                const label = ORDER_TYPE_MAP[t] ?? t
                const color = t === 'dine_in' ? 'blue' : t === 'takeaway' ? 'orange' : 'default'
                return <Tag color={color}>{label}</Tag>
              },
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              render: (s: string) => <Tag color={s === 'completed' ? 'green' : s === 'cancelled' ? 'default' : 'gold'}>{STATUS_MAP[s] ?? s}</Tag>,
            },
            { title: '金额', dataIndex: 'total_amount', width: 100, render: (v: number) => <Tag color="red">¥{v?.toFixed(2) ?? '0.00'}</Tag> },
            {
              title: '桌台',
              dataIndex: 'table_code',
              width: 120,
              render: (code: string, record: Order) => {
                if (!code) return <span style={{ color: '#bfbfbf' }}>—</span>
                const text = record.table_category ? `${record.table_category}-${code}` : code
                return <Tag color="cyan">{text}</Tag>
              },
            },
            {
              title: '创建日期',
              dataIndex: 'create_at',
              width: 180,
              render: (t: number) => (t ? new Date(t * 1000).toLocaleString('zh-CN') : '-'),
            },
            { title: '备注', dataIndex: 'remark', ellipsis: true, render: (value?: string) => value || '-' },
            {
              title: '操作',
              width: 180,
              fixed: 'right',
              render: (_: unknown, r: Order) => (
                <Space wrap>
                  <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(r.id)}>
                    查看
                  </Button>
                  <Select
                    size="small"
                    value={r.status}
                    onChange={(status) => handleUpdateStatus(r.id, status)}
                    style={{ width: 100 }}
                    options={Object.entries(STATUS_MAP).map(([k, v]) => ({ label: v, value: k }))}
                  />
                </Space>
              ),
            },
          ]}
          pagination={{ current: page, pageSize: 10, total, showTotal: (t) => `共 ${t} 条`, onChange: setPage }}
        />
      </Card>

      <Modal
        className="manage-modal"
        title="新建订单"
        open={modalOpen}
        onOk={onOk}
        onCancel={() => setModalOpen(false)}
        okText="提交"
        cancelText="取消"
        centered
        width={760}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Typography.Text className="modal-note">
            适合手动补单或前台快速录单，建议优先选择订单类型和桌台。
          </Typography.Text>

          <div className="manage-form-card">
            <span className="manage-form-card-title">订单信息</span>
            <div className="manage-form-grid">
              <Form.Item name="order_type" label="订单类型" rules={[{ required: true }]}>
                <Select options={Object.entries(ORDER_TYPE_MAP).map(([k, v]) => ({ label: v, value: k }))} />
              </Form.Item>
              <Form.Item noStyle shouldUpdate={(prev, cur) => prev?.order_type !== cur?.order_type}>
                {({ getFieldValue }) =>
                  getFieldValue('order_type') === 'dine_in' ? (
                    <Form.Item name="table_id" label="选择餐桌（选填）">
                      <Select
                        placeholder="请选择餐桌"
                        allowClear
                        options={tables.map((t) => ({ label: `${t.code}（${t.capacity}人）`, value: t.id }))}
                      />
                    </Form.Item>
                  ) : (
                    <Form.Item label="桌台信息">
                      <Input value="外带订单无需选择桌台" disabled />
                    </Form.Item>
                  )
                }
              </Form.Item>
            </div>
            <Form.Item name="remark" label="备注" style={{ marginBottom: 0 }}>
              <Input.TextArea rows={3} placeholder="选填" />
            </Form.Item>
          </div>

          <div className="manage-form-card">
            <span className="manage-form-card-title">菜品明细</span>
            <Form.Item label="菜品" style={{ marginBottom: 0 }}>
            <Form.List name="items">
              {(fields, { add, remove }) => (
                <div className="inline-editor-list">
                  {fields.map(({ key, name, ...rest }) => (
                    <div key={key} className="inline-editor-row">
                      <Form.Item {...rest} name={[name, 'menu_id']} label="菜品" rules={[{ required: true }]}>
                        <Select
                          placeholder="选择菜品"
                          options={menus.map((m) => ({ label: `${m.name} ¥${m.price}`, value: m.id }))}
                        />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'spec_info']} label="规格备注">
                        <Input placeholder="如：少辣、加饭" />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'quantity']} label="数量" rules={[{ required: true }]} initialValue={1}>
                        <InputNumber min={1} placeholder="数量" style={{ width: '100%' }} />
                      </Form.Item>
                      <Button type="text" danger onClick={() => remove(name)}>删</Button>
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add()} block>+ 添加菜品</Button>
                </div>
              )}
            </Form.List>
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        className="manage-modal"
        title="订单详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        centered
        width={760}
      >
        {detailOrder && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="订单号">{detailOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="类型">
                <Tag color={detailOrder.order_type === 'dine_in' ? 'blue' : detailOrder.order_type === 'takeaway' ? 'orange' : 'default'}>
                  {ORDER_TYPE_MAP[detailOrder.order_type] ?? detailOrder.order_type}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Select
                  size="small"
                  value={detailOrder.status}
                  onChange={(status) => handleUpdateStatus(detailOrder.id, status)}
                  style={{ width: 120 }}
                  options={Object.entries(STATUS_MAP).map(([k, v]) => ({ label: v, value: k }))}
                />
              </Descriptions.Item>
              <Descriptions.Item label="金额">¥{detailOrder.total_amount?.toFixed(2) ?? '0.00'}</Descriptions.Item>
              <Descriptions.Item label="桌台">
                {detailOrder.table_code || detailOrder.table_id ? (
                  <Tag color="cyan">
                    {detailOrder.table_category && detailOrder.table_code
                      ? `${detailOrder.table_category}-${detailOrder.table_code}`
                      : detailOrder.table_code ?? `#${detailOrder.table_id}`}
                  </Tag>
                ) : (
                  <span style={{ color: '#bfbfbf' }}>—</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="创建日期">
                {detailOrder.create_at ? new Date(detailOrder.create_at * 1000).toLocaleString('zh-CN') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="备注">{detailOrder.remark || '-'}</Descriptions.Item>
            </Descriptions>
            <Typography.Title level={5} style={{ marginTop: 16, marginBottom: 8 }}>订单明细</Typography.Title>
            <Table
              size="small"
              rowKey={(_, i) => String(i)}
              dataSource={detailOrder.items ?? []}
              scroll={{ x: 520 }}
              pagination={false}
              columns={[
                { title: '菜品', dataIndex: 'menu_name' },
                { title: '数量', dataIndex: 'quantity', width: 70 },
                { title: '单价', dataIndex: 'unit_price', width: 90, render: (v: number) => `¥${v?.toFixed(2) ?? '0.00'}` },
                { title: '小计', dataIndex: 'amount', width: 90, render: (v: number) => `¥${v?.toFixed(2) ?? '0.00'}` },
                { title: '规格', dataIndex: 'spec_info', ellipsis: true },
              ]}
            />
          </>
        )}
      </Modal>
    </div>
  )
}
