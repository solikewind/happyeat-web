import { useCallback, useEffect, useMemo, useState } from 'react'
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
  Row,
  Statistic,
  message,
  Popconfirm,
  Tag,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import type { MenuCategory, Menu, MenuSpec } from '../api/types'
import {
  listMenuCategories,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  listMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  getMenu,
} from '../api/menu'

// ============ 第一 Tab：菜单分类 ============

function CategoryTab() {
  const [list, setList] = useState<MenuCategory[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 10

  /** 弹窗：新建 vs 编辑。open 时 id 为空表示新建，有值表示编辑 */
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listMenuCategories({ current: page, pageSize })
      setList(res.categories)
      setTotal(res.total)
    } catch {
      message.error('加载分类列表失败')
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

  const openEdit = (record: MenuCategory) => {
    setEditingId(record.id)
    form.setFieldsValue({ name: record.name, description: record.description ?? '' })
    setModalOpen(true)
  }

  const onModalOk = async () => {
    const values = await form.validateFields()
    try {
      if (editingId == null) {
        await createMenuCategory({ name: values.name, description: values.description || undefined })
        message.success('创建成功')
      } else {
        await updateMenuCategory(editingId, {
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

  const onDelete = async (id: number) => {
    try {
      await deleteMenuCategory(id)
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
          <span className="manage-mini-stat-label">常见分类</span>
          <span className="manage-mini-stat-note">热菜 / 凉菜 / 饮品</span>
        </div>
      </div>

      <Card className="manage-table-card">
        <div className="manage-filter-bar">
          <div>
            <Typography.Title level={5} style={{ margin: 0 }}>
              菜单分类
            </Typography.Title>
            <Typography.Text type="secondary">
              用于维护点餐页的分类导航与菜品归属。
            </Typography.Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建分类
          </Button>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={list}
          scroll={{ x: 760 }}
          locale={{
            emptyText: <Empty className="table-empty-state" description="暂无分类，先创建一个分类吧" />,
          }}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 80 },
            {
              title: '分类名称',
              dataIndex: 'name',
              render: (value: string) => <Tag color="blue">{value}</Tag>,
            },
            { title: '描述', dataIndex: 'description', ellipsis: true, render: (value?: string) => value || '-' },
            {
              title: '创建日期',
              dataIndex: 'create_at',
              width: 180,
              render: (ts: number | undefined) => (ts ? new Date(ts * 1000).toLocaleString('zh-CN') : '-'),
            },
            {
              title: '操作',
              width: 156,
              render: (_, record) => (
                <Space>
                  <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
                    编辑
                  </Button>
                  <Popconfirm title="确定删除该分类？" onConfirm={() => onDelete(record.id)}>
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
            pageSize,
            total,
            showSizeChanger: false,
            showTotal: (t) => `共 ${t} 条`,
            onChange: setPage,
          }}
        />
      </Card>

      <Modal
        className="manage-modal"
        title={editingId == null ? '新建分类' : '编辑分类'}
        open={modalOpen}
        onOk={onModalOk}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        centered
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Typography.Text className="modal-note">
            分类会直接影响点餐页顶部导航，建议名称简洁明确。
          </Typography.Text>
          <div className="manage-form-card">
            <span className="manage-form-card-title">基础信息</span>
            <Form.Item name="name" label="分类名称" rules={[{ required: true, message: '请输入分类名称' }]}>
              <Input placeholder="如：热菜" />
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

// ============ 第二 Tab：菜品列表 ============

function MenuListTab() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined)
  const [nameSearch, setNameSearch] = useState<string | undefined>(undefined)
  const pageSize = 10

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()

  const loadCategories = useCallback(async () => {
    const res = await listMenuCategories({ current: 1, pageSize: 200 })
    setCategories(res.categories)
  }, [])

  const loadMenus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listMenus({
        current: page,
        pageSize,
        category: categoryFilter,
        name: nameSearch,
      })
      setMenus(res.menus)
      setTotal(res.total)
    } catch {
      message.error('加载菜品列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, categoryFilter, nameSearch])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    loadMenus()
  }, [loadMenus])

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))
  const pricedMenus = useMemo(() => menus.filter((item) => item.price > 0).length, [menus])

  const openCreate = async () => {
    setEditingId(null)
    form.resetFields()
    form.setFieldValue('specs', [])
    // 打开弹窗时重新加载分类列表，确保显示最新分类
    await loadCategories()
    setModalOpen(true)
  }

  const openEdit = async (record: Menu) => {
    setEditingId(record.id)
    try {
      const { menu } = await getMenu(record.id)
      form.setFieldsValue({
        name: menu.name,
        price: menu.price,
        category_id: menu.category_id,
        description: menu.description ?? '',
        image: menu.image ?? '',
        specs: (menu.specs && menu.specs.length) ? menu.specs : [],
      })
      setModalOpen(true)
    } catch {
      message.error('获取菜品详情失败')
    }
  }

  const onModalOk = async () => {
    const values = await form.validateFields()
    const specs: MenuSpec[] = (values.specs ?? [])
      .filter((s: { spec_type?: string }) => s?.spec_type)
      .map((s: { spec_type: string; spec_value: string; price_delta: number }) => ({
        spec_type: s.spec_type,
        spec_value: s.spec_value,
        price_delta: Number(s.price_delta) || 0,
      }))
    try {
      if (editingId == null) {
        await createMenu({
          name: values.name,
          price: Number(values.price),
          category_id: Number(values.category_id),
          description: values.description || undefined,
          image: values.image || undefined,
          specs: specs.length ? specs : undefined,
        })
        message.success('创建成功')
      } else {
        const menu: Menu = {
          id: editingId,
          name: values.name,
          price: Number(values.price),
          category_id: Number(values.category_id),
          description: values.description || undefined,
          image: values.image || undefined,
          specs: specs.length ? specs : undefined,
          create_at: 0,
          update_at: 0,
        }
        await updateMenu(editingId, menu)
        message.success('更新成功')
      }
      setModalOpen(false)
      loadMenus()
    } catch {
      message.error(editingId == null ? '创建失败' : '更新失败')
    }
  }

  const onDelete = async (id: number) => {
    try {
      await deleteMenu(id)
      message.success('已删除')
      loadMenus()
    } catch {
      message.error('删除失败')
    }
  }

  const handleSearch = (value: string) => {
    setNameSearch(value.trim() || undefined)
    setPage(1) // 搜索时重置到第一页
  }

  return (
    <div className="manage-shell">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="manage-stat-card">
            <Statistic title="菜品总数" value={total} suffix="道" />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="manage-stat-card">
            <Statistic title="当前页有图菜品" value={menus.filter((item) => !!item.image).length} suffix="道" />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="manage-stat-card">
            <Statistic title="已定价菜品" value={pricedMenus} suffix="道" />
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
              onChange={(v) => {
                setCategoryFilter(v ?? undefined)
                setPage(1)
              }}
              style={{ minWidth: 160 }}
              options={categories.map((c) => ({ label: c.name, value: c.name }))}
            />
            <Input.Search
              placeholder="搜索菜品名称"
              allowClear
              enterButton={<SearchOutlined />}
              style={{ width: 240 }}
              onSearch={handleSearch}
              onChange={(e) => {
                if (!e.target.value) {
                  setNameSearch(undefined)
                  setPage(1)
                }
              }}
            />
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建菜品
          </Button>
        </div>
      </Card>

      <Card className="manage-table-card">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={menus}
          scroll={{ x: 980 }}
          locale={{
            emptyText: <Empty className="table-empty-state" description="暂无菜品，先新增一道菜品吧" />,
          }}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 80 },
            {
              title: '图片',
              dataIndex: 'image',
              width: 84,
              render: (url: string | undefined) =>
                url ? (
                  <div className="table-thumb">
                    <img
                      src={url}
                      alt=""
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                ) : (
                  <Tag>无图</Tag>
                ),
            },
            { title: '菜品名称', dataIndex: 'name' },
            { title: '价格', dataIndex: 'price', width: 100, render: (v: number) => <Tag color="red">¥{v.toFixed(2)}</Tag> },
            {
              title: '分类',
              dataIndex: 'category_id',
              width: 120,
              render: (id: number) => <Tag color="blue">{categoryMap[id] ?? id}</Tag>,
            },
            { title: '描述', dataIndex: 'description', ellipsis: true, render: (value?: string) => value || '-' },
            {
              title: '操作',
              width: 156,
              render: (_, record) => (
                <Space>
                  <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
                    编辑
                  </Button>
                  <Popconfirm title="确定删除该菜品？" onConfirm={() => onDelete(record.id)}>
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
            pageSize,
            total,
            showSizeChanger: false,
            showTotal: (t) => `共 ${t} 条`,
            onChange: setPage,
          }}
        />
      </Card>

      <Modal
        className="manage-modal"
        title={editingId == null ? '新建菜品' : '编辑菜品'}
        open={modalOpen}
        onOk={onModalOk}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        centered
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Typography.Text className="modal-note">
            建议先填写名称、价格和分类，再补充图片和规格信息。
          </Typography.Text>

          <div className="manage-form-card">
            <span className="manage-form-card-title">基础信息</span>
            <div className="manage-form-grid">
              <Form.Item name="name" label="菜品名称" rules={[{ required: true }]}>
                <Input placeholder="如：宫保鸡丁" />
              </Form.Item>
              <Form.Item name="price" label="价格（元）" rules={[{ required: true }]}>
                <Input type="number" step={0.01} min={0} placeholder="0.00" />
              </Form.Item>
              <Form.Item name="category_id" label="所属分类" rules={[{ required: true, message: '请选择分类' }]}>
                <Select
                  placeholder="请选择分类"
                  options={categories.map((c) => ({ label: c.name, value: c.id }))}
                />
              </Form.Item>
              <Form.Item name="image" label="图片 URL">
                <Input placeholder="选填" />
              </Form.Item>
            </div>
            <Form.Item name="description" label="描述" style={{ marginBottom: 0 }}>
              <Input.TextArea rows={3} placeholder="可填写口味、推荐语或售卖说明" />
            </Form.Item>
          </div>

          <div className="manage-form-card">
            <span className="manage-form-card-title">规格配置</span>
            <Form.Item label="规格（如辣度、份量加价）" style={{ marginBottom: 0 }}>
            <Form.List name="specs">
              {(fields, { add, remove }) => (
                <div className="inline-editor-list">
                  {fields.map(({ key, name, ...rest }) => (
                    <div key={key} className="inline-editor-row">
                      <Form.Item {...rest} name={[name, 'spec_type']} label="类型" rules={[{ required: true }]}>
                        <Input placeholder="如：辣度" />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'spec_value']} label="选项" rules={[{ required: true }]}>
                        <Input placeholder="如：微辣" />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'price_delta']} label="加价">
                        <Input type="number" step={0.01} placeholder="0.00" />
                      </Form.Item>
                      <Button type="text" danger onClick={() => remove(name)}>
                        删除
                      </Button>
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add()} block>
                    + 添加规格
                  </Button>
                </div>
              )}
            </Form.List>
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

// ============ 页面入口 ============

export default function MenuManage() {
  return (
    <div className="manage-shell">
      <Card className="manage-hero-card">
        <div className="manage-hero-grid">
          <div>
            <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
              菜单管理
            </Typography.Title>
            <Typography.Text type="secondary">
              统一维护分类、菜品、图片和规格，保证点餐页和订单页展示清晰一致。
            </Typography.Text>
          </div>
          <div className="manage-highlight-list">
            <div className="manage-highlight-item">
              <Typography.Text type="secondary">建议</Typography.Text>
              <Typography.Title level={5} style={{ margin: '6px 0 0' }}>
                先建分类，再补菜品与规格
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
            { key: 'category', label: '菜单分类', children: <CategoryTab /> },
            { key: 'menu', label: '菜品列表', children: <MenuListTab /> },
          ]}
        />
      </Card>
    </div>
  )
}
