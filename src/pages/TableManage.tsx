import { createContext, useCallback, useContext, useEffect, useMemo, useState, type CSSProperties } from 'react'
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
  Tag,
  Typography,
  message,
} from 'antd'
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DeleteOutlined, EditOutlined, HolderOutlined, PlusOutlined } from '@ant-design/icons'
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

function renderManageModalTitle(title: string, description: string) {
  return (
    <div className="manage-modal-header-block">
      <span className="manage-modal-header-title">{title}</span>
      <span className="manage-modal-header-description">{description}</span>
    </div>
  )
}

function sortTableCategoriesForDisplay(list: TableCategory[]): TableCategory[] {
  const withSort = list.map((c) => ({ ...c, sort: c.sort ?? 0 }))
  return [...withSort].sort((a, b) => {
    if (a.sort !== b.sort) return a.sort - b.sort
    const idA = Number.parseInt(String(a.id), 10)
    const idB = Number.parseInt(String(b.id), 10)
    if (Number.isFinite(idA) && Number.isFinite(idB) && idA !== idB) return idA - idB
    return String(a.id).localeCompare(String(b.id))
  })
}

function sortTablesForDisplay(list: TableType[]): TableType[] {
  const withSort = list.map((t) => ({ ...t, sort: t.sort ?? 0 }))
  return [...withSort].sort((a, b) => {
    if (a.sort !== b.sort) return a.sort - b.sort
    const idA = Number.parseInt(String(a.id), 10)
    const idB = Number.parseInt(String(b.id), 10)
    if (Number.isFinite(idA) && Number.isFinite(idB) && idA !== idB) return idA - idB
    return String(a.id).localeCompare(String(b.id))
  })
}

type SortableTableCategoryRowProps = {
  item: TableCategory
  active: boolean
  canEditTable: boolean
  onSelect: () => void
  onEdit: (record: TableCategory) => void
  onDelete: (record: TableCategory) => void
}

function SortableTableCategoryRow({
  item,
  active,
  canEditTable,
  onSelect,
  onEdit,
  onDelete,
}: SortableTableCategoryRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !canEditTable,
  })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : undefined,
    opacity: isDragging ? 0.92 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`menu-workspace-side-item table-category-side-row${active ? ' menu-workspace-side-item-active' : ''}${isDragging ? ' menu-workspace-side-item-dragging' : ''}`}
    >
      <button
        type="button"
        className={`menu-workspace-side-drag-handle${!canEditTable ? ' menu-workspace-side-drag-handle-disabled' : ''}`}
        aria-label="拖动排序"
        {...(canEditTable ? attributes : {})}
        {...(canEditTable ? listeners : {})}
        tabIndex={canEditTable ? 0 : -1}
        onClick={(e) => e.stopPropagation()}
      >
        <HolderOutlined />
      </button>
      <button type="button" className="menu-workspace-side-item-btn table-category-side-select" onClick={onSelect}>
        <span className="menu-workspace-side-item-name">{item.name}</span>
      </button>
      <span className="menu-workspace-side-item-actions">
        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(item)} disabled={!canEditTable} />
        <Popconfirm title="确定删除该分类？" onConfirm={() => onDelete(item)} disabled={!canEditTable}>
          <Button type="text" size="small" danger icon={<DeleteOutlined />} disabled={!canEditTable} />
        </Popconfirm>
      </span>
    </div>
  )
}

const TableRowSortContext = createContext<{
  setActivatorNodeRef?: (element: HTMLElement | null) => void
  listeners?: ReturnType<typeof useSortable>['listeners']
}>({})

function TableDragHandle({ disabled }: { disabled: boolean }) {
  const ctx = useContext(TableRowSortContext)
  return (
    <button
      type="button"
      className={`menu-workspace-side-drag-handle${disabled ? ' menu-workspace-side-drag-handle-disabled' : ''}`}
      aria-label="拖动排序"
      ref={ctx.setActivatorNodeRef}
      {...(disabled ? {} : ctx.listeners)}
      tabIndex={disabled ? -1 : 0}
      onClick={(e) => e.stopPropagation()}
    >
      <HolderOutlined />
    </button>
  )
}

function TableSortableRow(props: React.HTMLAttributes<HTMLTableRowElement> & { 'data-row-key'?: string | number }) {
  const id = String(props['data-row-key'] ?? '')
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style: CSSProperties = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
  }
  const ctx = useMemo(() => ({ setActivatorNodeRef, listeners }), [setActivatorNodeRef, listeners])
  return (
    <TableRowSortContext.Provider value={ctx}>
      <tr {...props} ref={setNodeRef} style={style} {...attributes} />
    </TableRowSortContext.Provider>
  )
}

/** 餐桌工作台：左侧分类、右侧桌台列表（与菜单工作台同一套布局） */
function TableWorkspace() {
  const { can } = useAuth()
  const canEditTable = can('table:edit')

  const [categories, setCategories] = useState<TableCategory[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>()
  const [list, setList] = useState<TableType[]>([])
  const [total, setTotal] = useState(0)
  /** 未按分类筛选时的全库总数，用于侧栏「全部餐桌」角标 */
  const [globalTableTotal, setGlobalTableTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  /** 桌号搜索：输入框草稿 vs 已生效条件（回车/按钮搜索后写入） */
  const [tableNameDraft, setTableNameDraft] = useState('')
  const [tableNameApplied, setTableNameApplied] = useState('')

  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [categoryForm] = Form.useForm()

  const [tableModalOpen, setTableModalOpen] = useState(false)
  const [editingTableId, setEditingTableId] = useState<string | null>(null)
  const [editingTableSort, setEditingTableSort] = useState(0)
  const [editingCategorySort, setEditingCategorySort] = useState(0)
  const [tableForm] = Form.useForm()

  const canSortTables = Boolean(categoryFilter) && !tableNameApplied.trim()

  const loadCategories = useCallback(async () => {
    try {
      const res = await listTableCategories({ current: 1, pageSize: 200 })
      setCategories(asArray(res?.categories))
    } catch {
      message.error('加载分类失败')
    }
  }, [])

  const loadTables = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listTables({
        current: page,
        pageSize,
        category: categoryFilter,
        name: tableNameApplied.trim() || undefined,
      })
      setList(asArray(res?.tables))
      const t = Number(res?.total) || 0
      setTotal(t)
      if (!categoryFilter) setGlobalTableTotal(t)
    } catch {
      message.error('加载餐桌失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, categoryFilter, tableNameApplied])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    loadTables()
  }, [loadTables])

  const categoryMap = useMemo(() => Object.fromEntries(categories.map((item) => [item.id, item.name])), [categories])
  const sortedCategories = useMemo(() => sortTableCategoriesForDisplay(categories), [categories])
  const sortedTables = useMemo(() => sortTablesForDisplay(list), [list])
  const idleCount = list.filter((item) => item.status === 'idle').length
  const usingCount = list.filter((item) => item.status === 'using').length

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const openCategoryCreate = () => {
    if (!canEditTable) {
      message.warning('当前账号没有餐桌编辑权限')
      return
    }
    setEditingCategoryId(null)
    setEditingCategorySort(0)
    categoryForm.resetFields()
    setCategoryModalOpen(true)
  }

  const openCategoryEdit = (record: TableCategory) => {
    if (!canEditTable) {
      message.warning('当前账号没有餐桌编辑权限')
      return
    }
    setEditingCategoryId(record.id)
    setEditingCategorySort(record.sort ?? 0)
    categoryForm.setFieldsValue({
      name: record.name,
      description: record.description ?? '',
    })
    setCategoryModalOpen(true)
  }

  const onCategoryOk = async () => {
    const values = await categoryForm.validateFields()
    try {
      if (editingCategoryId == null) {
        await createTableCategory({
          name: values.name,
          description: values.description || undefined,
        })
        message.success('创建成功')
      } else {
        await updateTableCategory(editingCategoryId, {
          name: values.name,
          description: values.description ?? '',
          sort: editingCategorySort,
        })
        message.success('更新成功')
      }
      setCategoryModalOpen(false)
      await loadCategories()
      loadTables()
    } catch {
      message.error(editingCategoryId == null ? '创建失败' : '更新失败')
    }
  }

  const onCategoryDelete = async (record: TableCategory) => {
    if (!canEditTable) {
      message.warning('当前账号没有餐桌编辑权限')
      return
    }
    try {
      await deleteTableCategory(record.id)
      message.success('已删除')
      if (categoryFilter === record.name) {
        setCategoryFilter(undefined)
        setPage(1)
      }
      await loadCategories()
      loadTables()
    } catch {
      message.error('删除失败')
    }
  }

  const openTableCreate = async () => {
    if (!canEditTable) {
      message.warning('当前账号没有餐桌编辑权限')
      return
    }
    setEditingTableId(null)
    setEditingTableSort(0)
    tableForm.resetFields()
    tableForm.setFieldsValue({
      status: 'idle',
      category_id: categoryFilter ? categories.find((c) => c.name === categoryFilter)?.id : undefined,
    })
    await loadCategories()
    setTableModalOpen(true)
  }

  const openTableEdit = async (record: TableType) => {
    if (!canEditTable) {
      message.warning('当前账号没有餐桌编辑权限')
      return
    }
    setEditingTableId(record.id)
    setEditingTableSort(record.sort ?? 0)
    try {
      const { table } = await getTable(record.id)
      setEditingTableSort(table.sort ?? 0)
      tableForm.setFieldsValue({
        code: table.code,
        status: table.status,
        capacity: table.capacity,
        category_id: table.category_id,
        qr_code: table.qr_code ?? '',
      })
      setTableModalOpen(true)
    } catch {
      message.error('获取详情失败')
    }
  }

  const onTableOk = async () => {
    const values = await tableForm.validateFields()
    try {
      if (editingTableId == null) {
        await createTable({
          code: values.code,
          status: values.status,
          capacity: values.capacity,
          category_id: values.category_id,
          sort: 0,
          qr_code: values.qr_code || undefined,
        })
        message.success('创建成功')
      } else {
        await updateTable(editingTableId, {
          code: values.code,
          status: values.status,
          capacity: values.capacity,
          category_id: values.category_id,
          sort: editingTableSort,
          qr_code: values.qr_code || undefined,
        })
        message.success('更新成功')
      }
      setTableModalOpen(false)
      loadTables()
      try {
        const r = await listTables({ current: 1, pageSize: 1 })
        setGlobalTableTotal(Number(r?.total) || 0)
      } catch {
        /* ignore */
      }
    } catch {
      message.error('操作失败')
    }
  }

  const onTableDelete = async (id: string) => {
    if (!canEditTable) {
      message.warning('当前账号没有餐桌编辑权限')
      return
    }
    try {
      await deleteTable(id)
      message.success('已删除')
      loadTables()
      try {
        const r = await listTables({ current: 1, pageSize: 1 })
        setGlobalTableTotal(Number(r?.total) || 0)
      } catch {
        /* ignore */
      }
    } catch {
      message.error('删除失败')
    }
  }

  const onCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || String(active.id) === String(over.id)) return
    const oldIndex = sortedCategories.findIndex((c) => c.id === String(active.id))
    const newIndex = sortedCategories.findIndex((c) => c.id === String(over.id))
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = arrayMove(sortedCategories, oldIndex, newIndex)
    const withSort = reordered.map((c, index) => ({ ...c, sort: index }))
    const snapshot = [...categories]
    setCategories(withSort)
    try {
      await Promise.all(
        withSort.map((c) =>
          updateTableCategory(c.id, {
            name: c.name,
            description: c.description ?? '',
            sort: c.sort ?? 0,
          }),
        ),
      )
    } catch {
      message.error('保存分类排序失败')
      setCategories(snapshot)
    }
  }

  const onTableDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || String(active.id) === String(over.id)) return
    const oldIndex = sortedTables.findIndex((t) => t.id === String(active.id))
    const newIndex = sortedTables.findIndex((t) => t.id === String(over.id))
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = arrayMove(sortedTables, oldIndex, newIndex)
    const sortBase = (page - 1) * pageSize
    const withSort = reordered.map((t, index) => ({ ...t, sort: sortBase + index }))
    const snapshot = [...list]
    setList(withSort)
    try {
      await Promise.all(
        withSort.map((t) =>
          updateTable(t.id, {
            code: t.code,
            status: t.status,
            capacity: t.capacity,
            category_id: t.category_id,
            sort: t.sort ?? 0,
            qr_code: t.qr_code,
          }),
        ),
      )
    } catch {
      message.error('保存餐桌排序失败')
      setList(snapshot)
    }
  }

  return (
    <>
      <div className="menu-workspace-layout table-workspace-layout">
        <Card className="manage-panel-card menu-workspace-side">
          <div className="menu-workspace-side-header">
            <Typography.Text strong>餐桌分类</Typography.Text>
            <Button type="text" size="small" icon={<PlusOutlined />} onClick={openCategoryCreate} disabled={!canEditTable} />
          </div>
          <div className="menu-workspace-side-list">
            <button
              type="button"
              className={`menu-workspace-side-item${!categoryFilter ? ' menu-workspace-side-item-active' : ''}`}
              onClick={() => {
                setCategoryFilter(undefined)
                setPage(1)
              }}
            >
              <span className="menu-workspace-side-item-name">全部餐桌</span>
              <span className="menu-workspace-side-item-count">{globalTableTotal}</span>
            </button>
            {categories.length === 0 ? (
              <Empty className="menu-workspace-side-empty" description="还没有分类" />
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onCategoryDragEnd}>
                <SortableContext items={sortedCategories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  {sortedCategories.map((item) => (
                    <SortableTableCategoryRow
                      key={item.id}
                      item={item}
                      active={categoryFilter === item.name}
                      canEditTable={canEditTable}
                      onSelect={() => {
                        setCategoryFilter(item.name)
                        setPage(1)
                      }}
                      onEdit={openCategoryEdit}
                      onDelete={onCategoryDelete}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </Card>

        <div className="menu-workspace-main">
          <Card className="manage-table-card table-workspace-data-card">
            <div className="table-workspace-toolbar">
              <div className="manage-filter-bar table-workspace-filter">
                <div className="manage-filter-group">
                  <Input.Search
                    placeholder="按桌号搜索"
                    allowClear
                    style={{ width: 220 }}
                    value={tableNameDraft}
                    onChange={(e) => {
                      const v = e.target.value
                      setTableNameDraft(v)
                      if (v === '') {
                        setTableNameApplied('')
                        setPage(1)
                      }
                    }}
                    onSearch={(v) => {
                      setTableNameApplied(v.trim())
                      setPage(1)
                    }}
                  />
                  {categoryFilter ? (
                    <Tag
                      color="blue"
                      closable
                      onClose={(e) => {
                        e.preventDefault()
                        setCategoryFilter(undefined)
                        setPage(1)
                      }}
                      style={{ padding: '4px 10px', fontSize: 13 }}
                    >
                      分类：{categoryFilter}
                    </Tag>
                  ) : (
                    <Typography.Text type="secondary">在左侧选择区域，可筛选该分类下的餐桌</Typography.Text>
                  )}
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={openTableCreate} disabled={!canEditTable}>
                  新建餐桌
                </Button>
              </div>
              <div className="compact-summary-inline compact-summary-inline--dense">
                <Tag color="blue">餐桌总数 {total}</Tag>
                <Tag color="green">本页空闲 {idleCount}</Tag>
                <Tag color="orange">本页使用中 {usingCount}</Tag>
                {canSortTables ? <Tag color="cyan">拖动「排序」列调整顺序</Tag> : null}
              </div>
            </div>
            {(() => {
              const tableColumns = [
                ...(canSortTables
                  ? [{ key: 'sort', title: '排序', width: 56, className: 'table-col-sort', render: () => <TableDragHandle disabled={!canEditTable} /> }]
                  : []),
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
                      <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openTableEdit(record)} disabled={!canEditTable}>
                        编辑
                      </Button>
                      <Popconfirm title="确定删除？" onConfirm={() => onTableDelete(record.id)} disabled={!canEditTable}>
                        <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                          删除
                        </Button>
                      </Popconfirm>
                    </Space>
                  ),
                },
              ]
              const tableEl = (
                <Table
                  rowKey="id"
                  loading={loading}
                  dataSource={canSortTables ? sortedTables : list}
                  tableLayout="fixed"
                  scroll={{ x: canSortTables ? 1056 : 1000 }}
                  locale={{
                    emptyText: <Empty className="table-empty-state" description="暂无餐桌，先新增一个桌台吧" />,
                  }}
                  components={canSortTables ? { body: { row: TableSortableRow } } : undefined}
                  columns={tableColumns}
                  pagination={{
                    current: page,
                    pageSize,
                    total,
                    showSizeChanger: true,
                    pageSizeOptions: [10, 20, 50, 100],
                    showTotal: (count) => `共 ${count} 条`,
                    onChange: (nextPage, nextSize) => {
                      setPage(nextPage)
                      if (nextSize && nextSize !== pageSize) setPageSize(nextSize)
                    },
                  }}
                />
              )
              return canSortTables ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onTableDragEnd}>
                  <SortableContext items={sortedTables.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {tableEl}
                  </SortableContext>
                </DndContext>
              ) : (
                tableEl
              )
            })()}
          </Card>
        </div>
      </div>

      <Modal
        className="manage-modal"
        title={renderManageModalTitle(
          editingCategoryId == null ? '新建分类' : '编辑分类',
          '维护前厅区域名称，方便桌台、订单和点餐页统一显示。'
        )}
        open={categoryModalOpen}
        onOk={onCategoryOk}
        onCancel={() => setCategoryModalOpen(false)}
        okButtonProps={{ disabled: !canEditTable }}
        okText="保存"
        cancelText="取消"
        centered
        width={520}
        destroyOnClose
      >
        <Form form={categoryForm} layout="vertical" style={{ marginTop: 16 }}>
          <Typography.Text className="modal-note">分类用于桌台分组展示，也会影响订单和点餐页中的桌台标识。</Typography.Text>
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

      <Modal
        className="manage-modal"
        title={renderManageModalTitle(
          editingTableId == null ? '新建餐桌' : '编辑餐桌',
          '设置桌号、容量和所属区域，前厅点餐时会直接使用这里的数据。'
        )}
        open={tableModalOpen}
        onOk={onTableOk}
        onCancel={() => setTableModalOpen(false)}
        okButtonProps={{ disabled: !canEditTable }}
        okText="保存"
        cancelText="取消"
        centered
        width={640}
        destroyOnClose
      >
        <Form form={tableForm} layout="vertical" style={{ marginTop: 16 }}>
          <Typography.Text className="modal-note">建议统一桌号编码，并提前设置默认状态和容量。</Typography.Text>
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
                <Select placeholder="请选择" options={categories.map((item) => ({ label: item.name, value: item.id }))} />
              </Form.Item>
            </div>
            <Form.Item name="qr_code" label="二维码 URL" style={{ marginBottom: 0 }}>
              <Input placeholder="选填" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  )
}

export default function TableManage() {
  return (
    <div className="manage-shell table-manage-shell">
      <Card className="manage-panel-card table-manage-workspace-card">
        <TableWorkspace />
      </Card>
    </div>
  )
}
