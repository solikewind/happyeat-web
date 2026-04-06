import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { Table as TableType, TableCategory } from '../api/types'
import { useAuth } from '../contexts/AuthContext'
import {
  createTable,
  createTableCategory,
  deleteTable,
  deleteTableCategory,
  getTable,
  listTableCategories,
  listTables,
  updateTable,
  updateTableCategory,
} from '../api/table'

const asArray = <T,>(value: T[] | undefined | null) => (Array.isArray(value) ? value : [])

const TABLE_STATUS = {
  idle: '空闲',
  using: '使用中',
  reserved: '预留',
  cleaning: '清洁中',
} as const

function CategoryTab() {
  const { can } = useAuth()
  const canEditTable = can('table:edit')
  const [list, setList] = useState<TableCategory[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listTableCategories({ current: page, pageSize: 10 })
      setList(asArray(res?.categories))
      setTotal(Number(res?.total) || 0)
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
    if (!canEditTable) {
      message.warning('当前账号没有餐桌编辑权限')
      return
    }
    setEditingId(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (record: TableCategory) => {
    if (!canEditTable) {
      message.warning('当前账号没有餐桌编辑权限')
      return
    }
    setEditingId(record.id)
    form.setFieldsValue({
      name: record.name,
      description: record.description ?? '',
    })
    setModalOpen(true)
  }

  const onOk = async () => {
    const values = await form.validateFields()
    try {
      if (editingId == null) {
        await createTableCategory({
          name: values.name,
          description: values.description || undefined,
        })
        message.success('创建成功')
      } else {
        await updateTableCategory(editingId, {
          id: editingId,
          name: values.name,
          description: values.description || undefined,
        })
        message.success('更新成功')
      }
      setModalOpen(false)
      load()
    } catch {
      message.error(editingId == null ? '创建失败' : '更新失败')
    }
  }

  const onDelete = async (id: string) => {
    if (!canEditTable) {
      message.warning('当前账号没有餐桌编辑权限')
      return
    }
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
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={!canEditTable}>
            新建分类
          </Button>
        </div>

        <div className="compact-summary-inline">
          <Tag color="blue">分类总数 {total}</Tag>
          <Tag color="purple">本页显示 {list.length}</Tag>
          <Tag color="gold">应用场景 大厅 / 包间</Tag>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={list}
          tableLayout="fixed"
          scroll={{ x: 1000 }}
          locale={{
            emptyText: <Empty className="table-empty-state" description="暂无分类，先创建前厅区域分类" />,
          }}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 200, className: 'table-col-id' },
            {
              title: '分类名称',
              dataIndex: 'name',
              width: 160,
              ellipsis: true,
              render: (value: string) => <Tag color="blue">{value}</Tag>,
            },
            {
              title: '描述',
              dataIndex: 'description',
              ellipsis: true,
              render: (value?: string) => value || '-',
            },
            {
              title: '创建日期',
              dataIndex: 'create_at',
              width: 172,
              render: (ts: number | undefined) =>
                ts ? new Date(ts * 1000).toLocaleString('zh-CN') : '-',
            },
            {
              title: '操作',
              width: 168,
              fixed: 'right',
              className: 'table-col-actions',
              render: (_, record: TableCategory) => (
                <Space>
                  <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} disabled={!canEditTable}>
                    编辑
                  </Button>
                  <Popconfirm title="确定删除？" onConfirm={() => onDelete(record.id)} disabled={!canEditTable}>
                    <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
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
        title={editingId == null ? '新建分类' : '编辑分类'}
        open={modalOpen}
        onOk={onOk}
        onCancel={() => setModalOpen(false)}
        okButtonProps={{ disabled: !canEditTable }}
        okText="保存"
        cancelText="取消"
        centered
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Typography.Text className="modal-note">
            分类用于桌台分组展示，也会影响订单和点餐页中的桌台标识。
          </Typography.Text>
          <div className="manage-form-card">
            <span className="manage-form-card-title">基础信息</span>
            <Form.Item name="name" label="分类名称" rules={[{ required: true }]}>
              <Input placeholder="如：大厅" />
            </Form.Item>
            <Form.Item name="description" label="描述" style={{ marginBottom: 0 }}>
              <Input.TextArea rows={3} placeholder="选填" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

function TableListTab() {
  const { can } = useAuth()
  const canEditTable = can('table:edit')
  const [list, setList] = useState<TableType[]>([])
  const [categories, setCategories] = useState<TableCategory[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm()

  const loadCategories = useCallback(async () => {
    const res = await listTableCategories({ current: 1, pageSize: 200 })
    setCategories(asArray(res?.categories))
  }, [])

  const loadTables = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listTables({ current: page, pageSize: 10, category: categoryFilter })
      setList(asArray(res?.tables))
      setTotal(Number(res?.total) || 0)
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

  const categoryMap = Object.fromEntries(categories.map((item) => [item.id, item.name]))
  const idleCount = list.filter((item) => item.status === 'idle').length
  const usingCount = list.filter((item) => item.status === 'using').length

  const openCreate = async () => {
    if (!canEditTable) {
      message.warning('当前账号没有餐桌编辑权限')
      return
    }
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ status: 'idle' })
    await loadCategories()
    setModalOpen(true)
  }

  const openEdit = async (record: TableType) => {
    if (!canEditTable) {
      message.warning('当前账号没有餐桌编辑权限')
      return
    }
    setEditingId(record.id)
    try {
      const { table } = await getTable(record.id)
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
        })
        message.success('更新成功')
      }
      setModalOpen(false)
      loadTables()
    } catch {
      message.error('操作失败')
    }
  }

  const onDelete = async (id: string) => {
    if (!canEditTable) {
      message.warning('当前账号没有餐桌编辑权限')
      return
    }
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
      <Card className="manage-panel-card">
        <div className="manage-filter-bar">
          <div className="manage-filter-group">
            <Select
              allowClear
              placeholder="按分类筛选"
              value={categoryFilter ?? undefined}
              onChange={(value) => setCategoryFilter(value ?? undefined)}
              style={{ minWidth: 160 }}
              options={categories.map((item) => ({ label: item.name, value: item.name }))}
            />
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={!canEditTable}>
            新建餐桌
          </Button>
        </div>
      </Card>

      <Card className="manage-table-card">
        <div className="compact-summary-inline">
          <Tag color="blue">餐桌总数 {total}</Tag>
          <Tag color="green">本页空闲 {idleCount}</Tag>
          <Tag color="orange">本页使用中 {usingCount}</Tag>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={list}
          tableLayout="fixed"
          scroll={{ x: 1000 }}
          locale={{
            emptyText: <Empty className="table-empty-state" description="暂无餐桌，先新增一个桌台吧" />,
          }}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 200, className: 'table-col-id' },
            {
              title: '桌号',
              dataIndex: 'code',
              width: 112,
              ellipsis: true,
              render: (value: string) => <Tag color="blue">{value}</Tag>,
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 108,
              render: (status: keyof typeof TABLE_STATUS) => (
                <Tag color={status === 'using' ? 'orange' : status === 'idle' ? 'green' : 'default'}>
                  {TABLE_STATUS[status] ?? status}
                </Tag>
              ),
            },
            {
              title: '可坐人数',
              dataIndex: 'capacity',
              width: 104,
              render: (value: number) => `${value} 人`,
            },
            {
              title: '分类',
              dataIndex: 'category_id',
              width: 140,
              ellipsis: true,
              render: (id: string) => <Tag>{categoryMap[id] ?? id}</Tag>,
            },
            {
              title: '操作',
              width: 168,
              fixed: 'right',
              className: 'table-col-actions',
              render: (_, record: TableType) => (
                <Space>
                  <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} disabled={!canEditTable}>
                    编辑
                  </Button>
                  <Popconfirm title="确定删除？" onConfirm={() => onDelete(record.id)} disabled={!canEditTable}>
                    <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
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
        title={editingId == null ? '新建餐桌' : '编辑餐桌'}
        open={modalOpen}
        onOk={onOk}
        onCancel={() => setModalOpen(false)}
        okButtonProps={{ disabled: !canEditTable }}
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
              <Form.Item name="code" label="桌号" rules={[{ required: true }]}>
                <Input placeholder="如：A01" />
              </Form.Item>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select options={Object.entries(TABLE_STATUS).map(([key, value]) => ({ label: value, value: key }))} />
              </Form.Item>
              <Form.Item name="capacity" label="可坐人数" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="category_id" label="所属分类" rules={[{ required: true }]}>
                <Select
                  placeholder="请选择"
                  options={categories.map((item) => ({ label: item.name, value: item.id }))}
                />
              </Form.Item>
            </div>
            <Form.Item name="qr_code" label="二维码 URL" style={{ marginBottom: 0 }}>
              <Input placeholder="选填" />
            </Form.Item>
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
        <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
          餐桌管理
        </Typography.Title>
        <Typography.Text type="secondary">
          管理区域分类、桌台容量和状态，保证点餐页选择桌号时信息完整。
        </Typography.Text>
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
