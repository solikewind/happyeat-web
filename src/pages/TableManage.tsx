import { useEffect, useState, useCallback } from 'react'
import {
  Card,
  Col,
  Empty,
  Typography,
  Tabs,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Popconfirm,
  Row,
  Statistic,
  Tag,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { TableCategory, Table as TableType } from '../api/types'
import {
  listTableCategories,
  createTableCategory,
  updateTableCategory,
  deleteTableCategory,
  listTables,
  createTable,
  getTable,
  updateTable,
  deleteTable,
} from '../api/table'

const TABLE_STATUS = { idle: '空闲', using: '使用中', reserved: '预留', cleaning: '清洁中' } as const

function CategoryTab() {
  const [list, setList] = useState<TableCategory[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listTableCategories({ current: page, pageSize: 10 })
      setList(res.categories)
      setTotal(res.total)
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditingId(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (r: TableCategory) => {
    setEditingId(r.id)
    form.setFieldsValue({ name: r.name, description: r.description ?? '' })
    setModalOpen(true)
  }

  const onOk = async () => {
    const values = await form.validateFields()
    try {
      if (editingId == null) {
        await createTableCategory({ name: values.name, description: values.description || undefined })
        message.success('创建成功')
      } else {
        await updateTableCategory(editingId, { id: editingId, name: values.name, description: values.description || undefined })
        message.success('更新成功')
      }
      setModalOpen(false)
      load()
    } catch {
      message.error(editingId == null ? '创建失败' : '更新失败')
    }
  }

  const onDelete = async (id: number) => {
    try {
      await deleteTableCategory(id)
      message.success('已删除')
      load()
    } catch {
      message.error('删除失败')
    }
  }

  return (
    <div className="manage-shell">
      <div className="manage-mini-stats">
        <div className="manage-mini-stat">
          <span className="manage-mini-stat-label">分类总数</span>
          <span className="manage-mini-stat-value">{total} 项</span>
        </div>
        <div className="manage-mini-stat">
          <span className="manage-mini-stat-label">当前页数量</span>
          <span className="manage-mini-stat-value">{list.length} 项</span>
        </div>
        <div className="manage-mini-stat">
          <span className="manage-mini-stat-label">应用场景</span>
          <span className="manage-mini-stat-note">大厅 / 包间</span>
        </div>
      </div>

      <Card className="manage-table-card">
        <div className="manage-filter-bar">
          <div>
            <Typography.Title level={5} style={{ margin: 0 }}>
              餐桌分类
            </Typography.Title>
            <Typography.Text type="secondary">
              维护前厅区域划分，方便点餐和订单页显示桌台来源。
            </Typography.Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建分类</Button>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={list}
          scroll={{ x: 760 }}
          locale={{
            emptyText: <Empty className="table-empty-state" description="暂无分类，先创建前厅区域分类" />,
          }}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 80 },
            { title: '分类名称', dataIndex: 'name', render: (value: string) => <Tag color="blue">{value}</Tag> },
            { title: '描述', dataIndex: 'description', ellipsis: true, render: (value?: string) => value || '-' },
            {
              title: '创建日期',
              dataIndex: 'create_at',
              width: 160,
              render: (ts: number | undefined) => (ts ? new Date(ts * 1000).toLocaleString('zh-CN') : '-'),
            },
            {
              title: '操作',
              width: 120,
              render: (_, r) => (
                <Space>
                  <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
                  <Popconfirm title="确定删除？" onConfirm={() => onDelete(r.id)}>
                    <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
          pagination={{ current: page, pageSize: 10, total, showTotal: (t) => `共 ${t} 条`, onChange: setPage }}
        />
      </Card>

      <Modal
        className="manage-modal"
        title={editingId == null ? '新建分类' : '编辑分类'}
        open={modalOpen}
        onOk={onOk}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        centered
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Typography.Text className="modal-note">
            分类将用于桌台分组展示，也会影响订单和点餐页中的桌台标识。
          </Typography.Text>
          <div className="manage-form-card">
            <span className="manage-form-card-title">基础信息</span>
            <Form.Item name="name" label="分类名称" rules={[{ required: true }]}><Input placeholder="如：大厅" /></Form.Item>
            <Form.Item name="description" label="描述" style={{ marginBottom: 0 }}><Input.TextArea rows={3} placeholder="选填" /></Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

function TableListTab() {
  const [list, setList] = useState<TableType[]>([])
  const [categories, setCategories] = useState<TableCategory[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()

  const loadCategories = useCallback(async () => {
    const res = await listTableCategories({ current: 1, pageSize: 200 })
    setCategories(res.categories)
  }, [])

  const loadTables = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listTables({ current: page, pageSize: 10, category: categoryFilter })
      setList(Array.isArray(res?.tables) ? res.tables : [])
      setTotal(res?.total ?? 0)
    } catch {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }, [page, categoryFilter])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    loadTables()
  }, [loadTables])

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  const openCreate = async () => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ status: 'idle' })
    // 打开弹窗时重新加载分类列表，确保显示最新分类
    await loadCategories()
    setModalOpen(true)
  }

  const openEdit = async (r: TableType) => {
    setEditingId(r.id)
    try {
      const { table } = await getTable(r.id)
      form.setFieldsValue({
        code: table.code,
        status: table.status,
        capacity: table.capacity,
        category_id: table.category_id,
        qr_code: table.qr_code ?? '',
      })
      setModalOpen(true)
    } catch {
      message.error('获取详情失败')
    }
  }

  const onOk = async () => {
    const values = await form.validateFields()
    try {
      if (editingId == null) {
        await createTable({
          code: values.code,
          status: values.status,
          capacity: values.capacity,
          category_id: values.category_id,
          qr_code: values.qr_code || undefined,
        })
        message.success('创建成功')
      } else {
        await updateTable(editingId, {
          id: editingId,
          code: values.code,
          status: values.status,
          capacity: values.capacity,
          category_id: values.category_id,
          qr_code: values.qr_code || undefined,
          create_at: 0,
          update_at: 0,
        })
        message.success('更新成功')
      }
      setModalOpen(false)
      loadTables()
    } catch {
      message.error('操作失败')
    }
  }

  const onDelete = async (id: number) => {
    try {
      await deleteTable(id)
      message.success('已删除')
      loadTables()
    } catch {
      message.error('删除失败')
    }
  }

  return (
    <div className="manage-shell">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="manage-stat-card">
            <Statistic title="餐桌总数" value={total} suffix="桌" />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="manage-stat-card">
            <Statistic title="当前页空闲桌" value={list.filter((item) => item.status === 'idle').length} suffix="桌" />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="manage-stat-card">
            <Statistic title="当前页使用中" value={list.filter((item) => item.status === 'using').length} suffix="桌" />
          </Card>
        </Col>
      </Row>

      <Card className="manage-panel-card">
        <div className="manage-filter-bar">
          <div className="manage-filter-group">
            <Select
              allowClear
              placeholder="按分类筛选"
              value={categoryFilter ?? undefined}
              onChange={(v) => setCategoryFilter(v ?? undefined)}
              style={{ minWidth: 160 }}
              options={categories.map((c) => ({ label: c.name, value: c.name }))}
            />
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建餐桌</Button>
        </div>
      </Card>

      <Card className="manage-table-card">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={list}
          scroll={{ x: 860 }}
          locale={{
            emptyText: <Empty className="table-empty-state" description="暂无餐桌，先新增一个桌台吧" />,
          }}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 80 },
            { title: '桌号', dataIndex: 'code', width: 100, render: (value: string) => <Tag color="blue">{value}</Tag> },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              render: (s: keyof typeof TABLE_STATUS) => <Tag color={s === 'using' ? 'orange' : s === 'idle' ? 'green' : 'default'}>{TABLE_STATUS[s] ?? s}</Tag>,
            },
            { title: '可坐人数', dataIndex: 'capacity', width: 100, render: (value: number) => `${value} 人` },
            { title: '分类', dataIndex: 'category_id', width: 120, render: (id: number) => <Tag>{categoryMap[id] ?? id}</Tag> },
            {
              title: '操作',
              width: 120,
              render: (_: unknown, r: TableType) => (
                <Space>
                  <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
                  <Popconfirm title="确定删除？" onConfirm={() => onDelete(r.id)}>
                    <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
          pagination={{ current: page, pageSize: 10, total, showTotal: (t) => `共 ${t} 条`, onChange: setPage }}
        />
      </Card>

      <Modal
        className="manage-modal"
        title={editingId == null ? '新建餐桌' : '编辑餐桌'}
        open={modalOpen}
        onOk={onOk}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        centered
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Typography.Text className="modal-note">
            建议统一桌号编码，并提前设置默认状态和容量。
          </Typography.Text>
          <div className="manage-form-card">
            <span className="manage-form-card-title">桌台信息</span>
            <div className="manage-form-grid">
              <Form.Item name="code" label="桌号" rules={[{ required: true }]}><Input placeholder="如：A01" /></Form.Item>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select options={Object.entries(TABLE_STATUS).map(([k, v]) => ({ label: v, value: k }))} />
              </Form.Item>
              <Form.Item name="capacity" label="可坐人数" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
              <Form.Item name="category_id" label="所属分类" rules={[{ required: true }]}>
                <Select placeholder="请选择" options={categories.map((c) => ({ label: c.name, value: c.id }))} />
              </Form.Item>
            </div>
            <Form.Item name="qr_code" label="二维码 URL" style={{ marginBottom: 0 }}><Input placeholder="选填" /></Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default function TableManage() {
  return (
    <div className="manage-shell">
      <Card className="manage-hero-card">
        <div className="manage-hero-grid">
          <div>
            <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
              餐桌管理
            </Typography.Title>
            <Typography.Text type="secondary">
              管理区域分类、桌台容量和状态，保证点餐页选择桌号时信息完整。
            </Typography.Text>
          </div>
          <div className="manage-highlight-list">
            <div className="manage-highlight-item">
              <Typography.Text type="secondary">建议</Typography.Text>
              <Typography.Title level={5} style={{ margin: '6px 0 0' }}>
                桌号命名统一，如 A01、B02
              </Typography.Title>
            </div>
          </div>
        </div>
      </Card>

      <Card className="manage-panel-card">
        <Tabs
          className="manage-tabs"
          defaultActiveKey="category"
          items={[
            { key: 'category', label: '餐桌分类', children: <CategoryTab /> },
            { key: 'table', label: '餐桌列表', children: <TableListTab /> },
          ]}
        />
      </Card>
    </div>
  )
}
