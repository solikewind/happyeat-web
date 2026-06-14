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
  Popconfirm,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd'
import { EyeOutlined, PlusOutlined, WalletOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Order, Settlement } from '../api/types'
import { listOrders } from '../api/order'
import {
  addSettlementOrdersSequential,
  createSettlement,
  getSettlement,
  listSettlements,
  removeSettlementOrder,
  settleSettlement,
} from '../api/settlement'
import { useAuth } from '../contexts/AuthContext'
import { ORDER_TYPE_LABEL, orderStatusLabel, orderStatusTagColor } from '../utils/orderStatus'
import { formatYuan } from '../utils/statsRange'

function renderManageModalTitle(title: string, description: string) {
  return (
    <div className="manage-modal-header-block">
      <span className="manage-modal-header-title">{title}</span>
      <span className="manage-modal-header-description">{description}</span>
    </div>
  )
}

function settlementStatusLabel(status: string) {
  const s = String(status || '').toUpperCase()
  if (s === 'SETTLED') return '已结账'
  if (s === 'UNSETTLED') return '未结账'
  return status || '-'
}

function settlementStatusColor(status: string) {
  return String(status || '').toUpperCase() === 'SETTLED' ? 'green' : 'orange'
}

function formatTime(value?: string) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('zh-CN', { hour12: false })
}

export default function SettlementManage() {
  const { can } = useAuth()
  const canEdit = can('settlements:edit')
  const canSettle = can('settlements:settle')

  const [statusTab, setStatusTab] = useState<'UNSETTLED' | 'SETTLED'>('UNSETTLED')
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [customerFilter, setCustomerFilter] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm] = Form.useForm()

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState<Settlement | null>(null)

  const [addOrderOpen, setAddOrderOpen] = useState(false)
  const [addOrderLoading, setAddOrderLoading] = useState(false)
  const [addOrderSubmitting, setAddOrderSubmitting] = useState(false)
  const [candidateOrders, setCandidateOrders] = useState<Order[]>([])
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  const [addOrderPage, setAddOrderPage] = useState(1)
  const [addOrderTotal, setAddOrderTotal] = useState(0)
  const [addOrderNoSearch, setAddOrderNoSearch] = useState('')

  const [settleOpen, setSettleOpen] = useState(false)
  const [settleForm] = Form.useForm()
  const [settling, setSettling] = useState(false)

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listSettlements({
        current: page,
        pageSize: 10,
        status: statusTab,
        customer_name: customerFilter.trim() || undefined,
      })
      setSettlements(Array.isArray(res.settlements) ? res.settlements : [])
      setTotal(Number(res.total) || 0)
    } catch {
      message.error('加载结账单失败')
    } finally {
      setLoading(false)
    }
  }, [customerFilter, page, statusTab])

  useEffect(() => {
    loadList()
  }, [loadList])

  useEffect(() => {
    setPage(1)
  }, [statusTab, customerFilter])

  const openDetail = async (id: string) => {
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      const { settlement } = await getSettlement(id)
      setDetail(settlement)
    } catch {
      message.error('加载结账单详情失败')
      setDetailOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!canEdit) {
      message.warning('当前账号没有结账单编辑权限')
      return
    }
    try {
      const values = await createForm.validateFields()
      await createSettlement({
        customer_name: String(values.customer_name).trim(),
        remark: values.remark?.trim() || undefined,
      })
      message.success('结账单已创建')
      setCreateOpen(false)
      createForm.resetFields()
      setStatusTab('UNSETTLED')
      loadList()
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
      message.error('创建失败，可能该客户已有未结账结账单')
    }
  }

  const loadCandidateOrders = useCallback(
    async (page: number, orderNo?: string) => {
      if (!detail?.id) return
      const settlementId = String(detail.id)
      setAddOrderLoading(true)
      try {
        const res = await listOrders({
          current: page,
          pageSize: 10,
          order_no: orderNo?.trim() || undefined,
        })
        const list = (Array.isArray(res.orders) ? res.orders : []).filter((o) => {
          if (String(o.status || '').toLowerCase() === 'cancelled') return false
          const sid = o.settlement_id ? String(o.settlement_id) : ''
          if (sid && sid !== settlementId) return false
          return true
        })
        setCandidateOrders(list)
        setAddOrderTotal(Number(res.total) || 0)
        setAddOrderPage(page)
      } catch {
        message.error('加载订单失败')
      } finally {
        setAddOrderLoading(false)
      }
    },
    [detail?.id],
  )

  const openAddOrder = async () => {
    if (!detail?.id || !canEdit) return
    setSelectedOrderIds([])
    setAddOrderNoSearch('')
    setAddOrderPage(1)
    setAddOrderOpen(true)
    await loadCandidateOrders(1)
  }

  const handleAddOrder = async () => {
    if (!detail?.id || selectedOrderIds.length === 0) {
      message.warning('请选择订单')
      return
    }
    setAddOrderSubmitting(true)
    let addedCount = 0
    try {
      const result = await addSettlementOrdersSequential(detail.id, selectedOrderIds)
      addedCount = result.addedCount
      const { settlement } = await getSettlement(detail.id)
      setDetail(settlement)
      message.success(`已加入 ${addedCount} 笔订单`)
      setAddOrderOpen(false)
      loadList()
    } catch (err) {
      if (err && typeof err === 'object' && 'addedCount' in err && typeof err.addedCount === 'number') {
        addedCount = err.addedCount
      }
      try {
        const { settlement } = await getSettlement(detail.id)
        setDetail(settlement)
        loadList()
      } catch {
        // ignore refresh failure
      }
      if (addedCount > 0) {
        message.error(`已成功 ${addedCount} 笔，后续加入失败，请检查后重试`)
      } else {
        message.error('加入订单失败')
      }
    } finally {
      setAddOrderSubmitting(false)
    }
  }

  const isOrderAlreadyOnSettlement = useCallback(
    (order: Order) =>
      order.settlement_id != null && String(order.settlement_id) === String(detail?.id),
    [detail?.id],
  )

  const addableCandidateCount = useMemo(
    () => candidateOrders.filter((o) => !isOrderAlreadyOnSettlement(o)).length,
    [candidateOrders, isOrderAlreadyOnSettlement],
  )

  const handleRemoveOrder = useCallback(
    async (orderId: string) => {
      if (!detail?.id || !canEdit) return
      try {
        const updated = await removeSettlementOrder(detail.id, orderId)
        setDetail(updated.settlement)
        message.success('已移除')
        loadList()
      } catch {
        message.error('移除失败')
      }
    },
    [canEdit, detail?.id, loadList],
  )

  const openSettleModal = (st: Settlement) => {
    setDetail(st)
    settleForm.setFieldsValue({
      actual_amount: st.total_amount ?? 0,
      remark: st.remark ?? '',
    })
    setSettleOpen(true)
  }

  const handleSettle = async () => {
    if (!detail?.id) return
    try {
      const values = await settleForm.validateFields()
      setSettling(true)
      const updated = await settleSettlement(detail.id, {
        actual_amount: values.actual_amount,
        remark: values.remark?.trim() || undefined,
      })
      setDetail(updated.settlement)
      message.success('结账成功')
      setSettleOpen(false)
      setStatusTab('SETTLED')
      loadList()
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
      message.error('结账失败')
    } finally {
      setSettling(false)
    }
  }

  const isUnsettled = String(detail?.status || '').toUpperCase() === 'UNSETTLED'

  const listColumns: ColumnsType<Settlement> = [
    {
      title: '客户',
      dataIndex: 'customer_name',
      render: (name: string) => <Typography.Text strong>{name}</Typography.Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => <Tag color={settlementStatusColor(status)}>{settlementStatusLabel(status)}</Tag>,
    },
    { title: '订单数', dataIndex: 'order_count', width: 88, render: (v: number) => v ?? 0 },
    {
      title: '应收合计',
      dataIndex: 'total_amount',
      width: 120,
      render: (v: number) => <Tag color="red">{formatYuan(v)}</Tag>,
    },
    {
      title: '实收',
      dataIndex: 'actual_amount',
      width: 120,
      render: (v: number, record) =>
        String(record.status).toUpperCase() === 'SETTLED' ? <Tag color="green">{formatYuan(v)}</Tag> : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 168,
      render: (v: string) => formatTime(v),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(record.id)}>
            详情
          </Button>
          {String(record.status).toUpperCase() === 'UNSETTLED' && canSettle ? (
            <Button
              type="link"
              size="small"
              icon={<WalletOutlined />}
              onClick={async () => {
                try {
                  const { settlement } = await getSettlement(record.id)
                  openSettleModal(settlement)
                } catch {
                  message.error('加载结账单失败')
                }
              }}
            >
              结账
            </Button>
          ) : null}
        </Space>
      ),
    },
  ]

  const orderColumns: ColumnsType<Order> = useMemo(() => {
    const cols: ColumnsType<Order> = [
      { title: '订单号', dataIndex: 'order_no', width: 168, ellipsis: true },
      {
        title: '类型',
        dataIndex: 'order_type',
        width: 80,
        render: (v: string) => ORDER_TYPE_LABEL[v] ?? v,
      },
      { title: '桌号', dataIndex: 'table_code', width: 88, render: (v: string) => v || '-' },
      {
        title: '状态',
        dataIndex: 'status',
        width: 96,
        render: (status: string) => (
          <Tag color={orderStatusTagColor(status)}>{orderStatusLabel(status) || status}</Tag>
        ),
      },
      { title: '金额', dataIndex: 'total_amount', width: 100, render: (v: number) => formatYuan(v) },
      { title: '下单时间', dataIndex: 'created_at', width: 168, render: (v: string) => formatTime(v) },
    ]
    if (isUnsettled && canEdit) {
      cols.push({
        title: '操作',
        key: 'actions',
        width: 88,
        render: (_, record) => (
          <Popconfirm title="确定移除此订单？" onConfirm={() => handleRemoveOrder(record.id)}>
            <Button type="link" size="small" danger>
              移除
            </Button>
          </Popconfirm>
        ),
      })
    }
    return cols
  }, [canEdit, handleRemoveOrder, isUnsettled])

  const pageTotalAmount = useMemo(
    () => settlements.reduce((sum, item) => sum + (item.total_amount || 0), 0),
    [settlements],
  )

  return (
    <div className="manage-page">
      <Card className="manage-page-card" bordered={false}>
        <div className="manage-page-header">
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              结账单
            </Typography.Title>
            <Typography.Text type="secondary">多笔订单挂到同一客户名下，稍后合并结账</Typography.Text>
          </div>
          <Space wrap>
            <Tag color="blue">本页应收 {formatYuan(pageTotalAmount)}</Tag>
            {canEdit ? (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                新建结账单
              </Button>
            ) : null}
          </Space>
        </div>

        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Tabs
            activeKey={statusTab}
            onChange={(key) => setStatusTab(key as 'UNSETTLED' | 'SETTLED')}
            items={[
              { key: 'UNSETTLED', label: '未结账' },
              { key: 'SETTLED', label: '已结账' },
            ]}
          />
          <Input.Search
            allowClear
            placeholder="按客户名搜索"
            style={{ maxWidth: 280 }}
            onSearch={(v) => setCustomerFilter(v)}
          />
          <Table
            rowKey="id"
            loading={loading}
            columns={listColumns}
            dataSource={settlements}
            locale={{ emptyText: <Empty description="暂无结账单" /> }}
            pagination={{
              current: page,
              pageSize: 10,
              total,
              showSizeChanger: false,
              onChange: (p) => setPage(p),
            }}
          />
        </Space>
      </Card>

      <Modal
        title={renderManageModalTitle('新建结账单', '同一客户同时只能有一张未结账结账单')}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreate}
        okText="创建"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="customer_name" label="客户名" rules={[{ required: true, message: '请输入客户名' }]}>
            <Input placeholder="如：老张" maxLength={64} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="可选" maxLength={200} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={renderManageModalTitle(
          detail ? `${detail.customer_name} · 结账单` : '结账单详情',
          isUnsettled ? '可添加订单，最后统一结账' : '已结账，仅供查看',
        )}
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false)
          setDetail(null)
        }}
        width={920}
        footer={
          <Space>
            <Button onClick={() => setDetailOpen(false)}>关闭</Button>
            {isUnsettled && canEdit ? <Button onClick={openAddOrder}>添加订单</Button> : null}
            {isUnsettled && canSettle ? (
              <Button type="primary" icon={<WalletOutlined />} onClick={() => detail && openSettleModal(detail)}>
                结账
              </Button>
            ) : null}
          </Space>
        }
        destroyOnClose
      >
        {detailLoading ? (
          <Typography.Text type="secondary">加载中…</Typography.Text>
        ) : detail ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="客户">{detail.customer_name}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={settlementStatusColor(detail.status)}>{settlementStatusLabel(detail.status)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="应收合计">{formatYuan(detail.total_amount)}</Descriptions.Item>
              <Descriptions.Item label="实收">
                {String(detail.status).toUpperCase() === 'SETTLED' ? formatYuan(detail.actual_amount) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatTime(detail.created_at)}</Descriptions.Item>
              <Descriptions.Item label="结账时间">{formatTime(detail.settled_at)}</Descriptions.Item>
              {detail.remark ? (
                <Descriptions.Item label="备注" span={2}>
                  {detail.remark}
                </Descriptions.Item>
              ) : null}
            </Descriptions>
            <Table
              rowKey={(record) => String(record.id)}
              size="small"
              columns={orderColumns}
              dataSource={detail.orders ?? []}
              pagination={false}
              locale={{ emptyText: '暂无订单，点击「添加订单」' }}
            />
          </Space>
        ) : null}
      </Modal>

      <Modal
        title="添加订单"
        open={addOrderOpen}
        onCancel={() => setAddOrderOpen(false)}
        onOk={handleAddOrder}
        okText={selectedOrderIds.length > 0 ? `加入 ${selectedOrderIds.length} 笔` : '加入'}
        confirmLoading={addOrderSubmitting}
        okButtonProps={{ disabled: addOrderLoading || selectedOrderIds.length === 0 }}
        width={760}
        destroyOnClose
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
          可多选；已取消订单不可加入；已在其他未结账结账单中的订单不会显示。本页可加入 {addableCandidateCount} 笔。
        </Typography.Paragraph>
        <Input.Search
          allowClear
          placeholder="按订单号搜索"
          value={addOrderNoSearch}
          onChange={(e) => setAddOrderNoSearch(e.target.value)}
          onSearch={(v) => {
            setAddOrderNoSearch(v)
            loadCandidateOrders(1, v)
          }}
          style={{ marginBottom: 12, maxWidth: 320 }}
        />
        <Table
          rowKey={(record) => String(record.id)}
          size="small"
          loading={addOrderLoading}
          dataSource={candidateOrders}
          pagination={{
            current: addOrderPage,
            pageSize: 10,
            total: addOrderTotal,
            showSizeChanger: false,
            onChange: (p) => loadCandidateOrders(p, addOrderNoSearch),
          }}
          locale={{ emptyText: '暂无可加入的订单' }}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedOrderIds,
            onChange: (keys) => setSelectedOrderIds(keys.map((k) => String(k))),
            getCheckboxProps: (record) => ({
              disabled: isOrderAlreadyOnSettlement(record),
            }),
          }}
          columns={[
            { title: '订单号', dataIndex: 'order_no', width: 168, ellipsis: true },
            {
              title: '桌号',
              dataIndex: 'table_code',
              width: 88,
              render: (v: string) => v || '外带',
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 96,
              render: (status: string) => (
                <Tag color={orderStatusTagColor(status)}>{orderStatusLabel(status) || status}</Tag>
              ),
            },
            {
              title: '金额',
              dataIndex: 'total_amount',
              width: 100,
              render: (v: number) => formatYuan(v),
            },
            {
              title: '备注',
              key: 'hint',
              width: 100,
              render: (_, record) =>
                isOrderAlreadyOnSettlement(record) ? <Tag>已在当前结账单</Tag> : null,
            },
          ]}
        />
      </Modal>

      <Modal
        title={renderManageModalTitle('结账单结账', '录入实收金额，支持抹零')}
        open={settleOpen}
        onCancel={() => setSettleOpen(false)}
        onOk={handleSettle}
        okText="确认结账"
        confirmLoading={settling}
        destroyOnClose
      >
        <Form form={settleForm} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item label="应收合计">
            <Typography.Text strong>{formatYuan(detail?.total_amount ?? 0)}</Typography.Text>
          </Form.Item>
          <Form.Item
            name="actual_amount"
            label="实收金额"
            rules={[{ required: true, message: '请输入实收金额' }]}
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} maxLength={200} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
