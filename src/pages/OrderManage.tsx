import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import type { Order, Menu, Table as TTable } from '../api/types'
import { createOrder, getOrder, listOrders, updateOrderStatus } from '../api/order'
import { listMenus } from '../api/menu'
import { listTables } from '../api/table'
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

const STATUS_COLOR_MAP: Record<string, string> = {
  created: 'default',
  paid: 'blue',
  preparing: 'processing',
  completed: 'success',
  cancelled: 'default',
}

export default function OrderManage() {
  const { can } = useAuth()
  const canCreateOrder = can('orders:create')
  const canUpdateOrderStatus = can('orders:update_status')
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [pendingTotal, setPendingTotal] = useState(0)
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

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [res, createdRes, paidRes, preparingRes] = await Promise.all([
        listOrders({
          current: page,
          pageSize: 10,
          status: statusFilter,
          order_type: orderTypeFilter,
        }),
        listOrders({
          current: 1,
          pageSize: 1,
          status: 'created',
          order_type: orderTypeFilter,
        }),
        listOrders({
          current: 1,
          pageSize: 1,
          status: 'paid',
          order_type: orderTypeFilter,
        }),
        listOrders({
          current: 1,
          pageSize: 1,
          status: 'preparing',
          order_type: orderTypeFilter,
        }),
      ])
      setOrders(Array.isArray(res?.orders) ? res.orders : [])
      setTotal(Number(res?.total) || 0)
      setPendingTotal((Number(createdRes?.total) || 0) + (Number(paidRes?.total) || 0) + (Number(preparingRes?.total) || 0))
    } catch {
      message.error('加载订单失败')
    } finally {
      setLoading(false)
    }
  }, [orderTypeFilter, page, statusFilter])

  useEffect(() => {
    load()
  }, [load])

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
    if (!canUpdateOrderStatus) {
      message.warning('当前账号没有订单状态更新权限')
      return
    }
    try {
      await updateOrderStatus(id, status)
      message.success('订单状态已更新')
      load()
      setDetailOrder((prev) => (prev?.id === id ? { ...prev, status } : prev))
    } catch {
      message.error('更新订单状态失败')
    }
  }

  const openCreate = async () => {
    if (!canCreateOrder) {
      message.warning('当前账号没有新建订单权限')
      return
    }
    form.resetFields()
    form.setFieldsValue({ order_type: 'dine_in', items: [{ quantity: 1 }] })
    try {
      const [menuRes, tableRes] = await Promise.all([
        listMenus({ current: 1, pageSize: 500 }),
        listTables({ current: 1, pageSize: 500 }),
      ])
      setMenus(Array.isArray(menuRes?.menus) ? menuRes.menus : [])
      const availableTables = Array.isArray(tableRes?.tables) ? tableRes.tables : []
      setTables(availableTables.filter((table) => table.status === 'idle' || table.status === 'using'))
      setModalOpen(true)
    } catch {
      message.error('加载下单数据失败')
    }
  }

  const onOk = async () => {
    if (!canCreateOrder) {
      message.warning('当前账号没有新建订单权限')
      return
    }
    const values = await form.validateFields()
    const items = (values.items ?? []).filter((item: { menu_id?: number; quantity?: number }) => item?.menu_id && item?.quantity)
    if (!items.length) {
      message.error('请至少添加一道菜品')
      return
    }

    const menuMap = Object.fromEntries(menus.map((menu) => [menu.id, menu]))
    let totalAmount = 0
    const bodyItems = items.map((item: { menu_id: number; quantity: number; spec_info?: string }) => {
      const menu = menuMap[item.menu_id]
      const unitPrice = menu?.price ?? 0
      totalAmount += unitPrice * item.quantity
      return {
        menu_name: menu?.name ?? '',
        quantity: item.quantity,
        unit_price: unitPrice,
        spec_info: item.spec_info || undefined,
      }
    })

    try {
      await createOrder({
        order_type: values.order_type,
        table_id: values.order_type === 'dine_in' ? values.table_id : undefined,
        items: bodyItems,
        total_amount: Math.round(totalAmount * 100) / 100,
        remark: values.remark || undefined,
      })
      message.success('订单创建成功')
      setModalOpen(false)
      load()
    } catch {
      message.error('订单创建失败')
    }
  }

  const preparingCount = useMemo(() => orders.filter((item) => item.status === 'preparing').length, [orders])
  const pageAmount = useMemo(() => orders.reduce((sum, item) => sum + (item.total_amount || 0), 0), [orders])

  return (
    <div className="manage-shell">
      <Card className="order-desk-filter-card">
        <div className="manage-filter-bar">
          <div className="manage-filter-group">
            <Select
              allowClear
              placeholder="按订单状态筛选"
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
              style={{ minWidth: 160 }}
              options={Object.entries(STATUS_MAP).map(([value, label]) => ({ value, label }))}
            />
            <Select
              allowClear
              placeholder="按订单类型筛选"
              value={orderTypeFilter}
              onChange={(value) => {
                setOrderTypeFilter(value)
                setPage(1)
              }}
              style={{ minWidth: 160 }}
              options={Object.entries(ORDER_TYPE_MAP).map(([value, label]) => ({ value, label }))}
            />
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={!canCreateOrder}>
            新建订单
          </Button>
        </div>
      </Card>

      <Card className="manage-table-card">
        <div className="compact-summary-inline">
          <Tag color="blue">待处理总数 {pendingTotal}</Tag>
          <Tag color="purple">本页制作中 {preparingCount}</Tag>
          <Tag color="gold">本页金额 ¥{pageAmount.toFixed(2)}</Tag>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={orders}
          scroll={{ x: 1180 }}
          locale={{ emptyText: <Empty className="table-empty-state" description="暂无订单记录" /> }}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 70 },
            { title: '订单号', dataIndex: 'order_no', width: 180, ellipsis: true },
            {
              title: '类型',
              dataIndex: 'order_type',
              width: 110,
              render: (value: string) => <Tag color={value === 'dine_in' ? 'blue' : 'orange'}>{ORDER_TYPE_MAP[value] ?? value}</Tag>,
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 110,
              render: (value: string) => <Tag color={STATUS_COLOR_MAP[value]}>{STATUS_MAP[value] ?? value}</Tag>,
            },
            {
              title: '金额',
              dataIndex: 'total_amount',
              width: 110,
              render: (value: number) => <Tag color="red">¥{value?.toFixed(2) ?? '0.00'}</Tag>,
            },
            {
              title: '桌台',
              dataIndex: 'table_code',
              width: 130,
              render: (code: string | undefined, record: Order) => {
                if (!code) return '-'
                return <Tag color="cyan">{record.table_category ? `${record.table_category}-${code}` : code}</Tag>
              },
            },
            {
              title: '创建时间',
              dataIndex: 'create_at',
              width: 180,
              render: (value: number) => (value ? new Date(value * 1000).toLocaleString('zh-CN') : '-'),
            },
            {
              title: '备注',
              dataIndex: 'remark',
              ellipsis: true,
              render: (value?: string) => value || '-',
            },
            {
              title: '操作',
              width: 190,
              fixed: 'right',
              render: (_: unknown, record: Order) => (
                <Space wrap>
                  <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(record.id)}>
                    查看
                  </Button>
                  <Select
                    size="small"
                    value={record.status}
                    onChange={(status) => handleUpdateStatus(record.id, status)}
                    disabled={!canUpdateOrderStatus}
                    style={{ width: 108 }}
                    options={Object.entries(STATUS_MAP).map(([value, label]) => ({ value, label }))}
                  />
                </Space>
              ),
            },
          ]}
          pagination={{
            current: page,
            pageSize: 10,
            total,
            showTotal: (count) => `共 ${count} 条`,
            onChange: setPage,
          }}
        />
      </Card>

      <Modal
        className="manage-modal"
        title="新建订单"
        open={modalOpen}
        onOk={onOk}
        onCancel={() => setModalOpen(false)}
        okButtonProps={{ disabled: !canCreateOrder }}
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
                <Select options={Object.entries(ORDER_TYPE_MAP).map(([value, label]) => ({ value, label }))} />
              </Form.Item>
              <Form.Item noStyle shouldUpdate={(prev, cur) => prev?.order_type !== cur?.order_type}>
                {({ getFieldValue }) =>
                  getFieldValue('order_type') === 'dine_in' ? (
                    <Form.Item name="table_id" label="选择餐桌（选填）">
                      <Select
                        placeholder="请选择餐桌"
                        allowClear
                        options={tables.map((table) => ({ label: `${table.code}（${table.capacity}人）`, value: table.id }))}
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
                            options={menus.map((menu) => ({ label: `${menu.name} ¥${menu.price}`, value: menu.id }))}
                          />
                        </Form.Item>
                        <Form.Item {...rest} name={[name, 'spec_info']} label="规格备注">
                          <Input placeholder="如：少辣、加饭" />
                        </Form.Item>
                        <Form.Item {...rest} name={[name, 'quantity']} label="数量" rules={[{ required: true }]} initialValue={1}>
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
        {detailOrder ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="订单号">{detailOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="订单类型">{ORDER_TYPE_MAP[detailOrder.order_type] ?? detailOrder.order_type}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={STATUS_COLOR_MAP[detailOrder.status]}>{STATUS_MAP[detailOrder.status] ?? detailOrder.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="订单金额">¥{detailOrder.total_amount?.toFixed(2) ?? '0.00'}</Descriptions.Item>
              <Descriptions.Item label="桌台">
                {detailOrder.table_code ? `${detailOrder.table_category ? `${detailOrder.table_category}-` : ''}${detailOrder.table_code}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {detailOrder.create_at ? new Date(detailOrder.create_at * 1000).toLocaleString('zh-CN') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {detailOrder.remark || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Card className="manage-form-card">
              <span className="manage-form-card-title">订单明细</span>
              {detailOrder.items?.length ? (
                <Table
                  rowKey={(item, index) => `${item.menu_name}-${index}`}
                  size="small"
                  pagination={false}
                  dataSource={detailOrder.items}
                  columns={[
                    { title: '菜品', dataIndex: 'menu_name' },
                    { title: '规格', dataIndex: 'spec_info', render: (value?: string) => value || '-' },
                    { title: '数量', dataIndex: 'quantity', width: 90 },
                    { title: '单价', dataIndex: 'unit_price', width: 110, render: (value: number) => `¥${value?.toFixed(2) ?? '0.00'}` },
                    { title: '金额', dataIndex: 'amount', width: 110, render: (value: number) => `¥${value?.toFixed(2) ?? '0.00'}` },
                  ]}
                />
              ) : (
                <Empty description="暂无明细" />
              )}
            </Card>
          </Space>
        ) : null}
      </Modal>
    </div>
  )
}
