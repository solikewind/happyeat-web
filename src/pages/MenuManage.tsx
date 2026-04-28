import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Collapse,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Segmented,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Tooltip,
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
import { DeleteOutlined, EditOutlined, FundProjectionScreenOutlined, HolderOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import type { CategorySpec, Menu, MenuCategory, MenuSpec, SpecGroup, SpecItem } from '../api/types'
import { useAuth } from '../contexts/AuthContext'
import { appPath } from '../utils/appPath'
import {
  createMenu,
  createMenuCategory,
  deleteMenu,
  deleteMenuCategory,
  getMenu,
  listMenuCategories,
  listMenus,
  updateMenu,
  updateMenuCategory,
} from '../api/menu'
import {
  createCategorySpec,
  createSpecGroup,
  createSpecItem,
  deleteCategorySpec,
  deleteSpecGroup,
  deleteSpecItem,
  listCategorySpecs,
  listSpecGroups,
  listSpecItems,
  updateSpecGroup,
  updateSpecItem,
  updateCategorySpec,
} from '../api/spec'

const asArray = <T,>(value: T[] | undefined | null) => (Array.isArray(value) ? value : [])
const MENU_IMAGE_FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
      <rect width="100%" height="100%" fill="#f5f5f5"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-size="12">图片加载失败</text>
    </svg>`
  )

const normalizeImageUrl = (url?: string): string | undefined => {
  const raw = url?.trim()
  if (!raw) return undefined
  if (raw.startsWith('//')) return `https:${raw}`
  return raw
}

const extractErrorMessage = (error: unknown): string | undefined => {
  const err = error as {
    response?: { data?: { msg?: string; message?: string } }
    message?: string
  }
  return err?.response?.data?.msg || err?.response?.data?.message || err?.message
}

const formatDateTime = (value?: string | number): string => {
  if (value == null || value === '') return '-'
  if (typeof value === 'number') return new Date(value * 1000).toLocaleString('zh-CN')
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? value : new Date(timestamp).toLocaleString('zh-CN')
}

// 统一金额精度到 2 位小数，避免 number 浮点误差导致 68 -> 67.99 这类问题。
const normalizeMoneyYuan = (value: unknown): number => {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.round((n + Number.EPSILON) * 100) / 100
}

type CategorySpecSourceMode = 'library' | 'manual'

type CategorySpecImportPreview = {
  spec_group_id: string
  spec_group_name: string
  spec_item_id: string
  spec_value: string
  price_delta: number
}

function renderManageModalTitle(title: string, description: string) {
  return (
    <div className="manage-modal-header-block">
      <span className="manage-modal-header-title">{title}</span>
      <span className="manage-modal-header-description">{description}</span>
    </div>
  )
}

function CategorySpecTab({ preferredCategoryId }: { preferredCategoryId?: string }) {
  const { can } = useAuth()
  const canEditMenu = can('menu:edit')
  const [list, setList] = useState<CategorySpec[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [libraryGroups, setLibraryGroups] = useState<SpecGroup[]>([])
  const [libraryItems, setLibraryItems] = useState<SpecItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>()
  const [specTypeFilter, setSpecTypeFilter] = useState<string | undefined>()
  const [modalOpen, setModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm()
  const [importForm] = Form.useForm()
  const [importItems, setImportItems] = useState<CategorySpecImportPreview[]>([])
  const selectedSourceMode = (Form.useWatch('source_mode', form) as CategorySpecSourceMode | undefined) ?? 'library'
  const selectedLibraryGroupId = Form.useWatch('library_spec_group_id', form) as string | undefined

  const loadCategories = useCallback(async () => {
    const res = await listMenuCategories({ current: 1, pageSize: 200 })
    const categories = asArray(res?.categories)
    setCategories(categories)
    return categories
  }, [])

  const loadLibraryGroups = useCallback(async () => {
    const res = await listSpecGroups({ current: 1, pageSize: 200 })
    const groups = asArray(res?.groups)
    setLibraryGroups(groups)
    return groups
  }, [])

  const loadLibraryItems = useCallback(async (groupId?: string) => {
    if (!groupId) {
      setLibraryItems([])
      return []
    }
    const res = await listSpecItems({
      current: 1,
      pageSize: 200,
      spec_group_id: groupId,
    })
    const items = asArray(res?.items)
    setLibraryItems(items)
    return items
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listCategorySpecs({
        current: 1,
        pageSize: 200,
        category_id: categoryFilter,
        spec_type: specTypeFilter,
      })
      setList(asArray(res?.specs))
      setTotal(Number(res?.total) || 0)
    } catch {
      message.error('加载分类规格失败')
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, specTypeFilter])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (preferredCategoryId) {
      setCategoryFilter(preferredCategoryId)
    }
  }, [preferredCategoryId])

  useEffect(() => {
    if (!categoryFilter && categories.length > 0) {
      setCategoryFilter(categories[0].id)
    }
  }, [categories, categoryFilter])

  useEffect(() => {
    if (!modalOpen || selectedSourceMode !== 'library') {
      setLibraryItems([])
      return
    }
    void loadLibraryItems(selectedLibraryGroupId)
  }, [loadLibraryItems, modalOpen, selectedLibraryGroupId, selectedSourceMode])

  const groupedSpecs = useMemo(() => {
    const groups = new Map<string, CategorySpec[]>()
    list.forEach((item) => {
      const key = item.spec_type || '未命名规格'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(item)
    })
    return Array.from(groups.entries()).map(([specType, items]) => ({ specType, items }))
  }, [list])

  const openCreate = async () => {
    if (!canEditMenu) {
      message.warning('当前账号没有菜单编辑权限')
      return
    }
    await Promise.all([loadCategories(), loadLibraryGroups()])
    setEditingId(null)
    form.resetFields()
    setLibraryItems([])
    form.setFieldsValue({
      category_id: categoryFilter,
      source_mode: 'library',
      price_delta: 0,
      sort: 0,
    })
    setModalOpen(true)
  }

  const openEdit = async (record: CategorySpec) => {
    if (!canEditMenu) {
      message.warning('当前账号没有菜单编辑权限')
      return
    }
    const [, groups] = await Promise.all([loadCategories(), loadLibraryGroups()])
    setEditingId(record.id)
    const matchedGroup = groups.find((item) => item.name === record.spec_type)
    if (record.spec_item_id && matchedGroup?.id) {
      await loadLibraryItems(matchedGroup.id)
    } else {
      setLibraryItems([])
    }
    form.setFieldsValue({
      category_id: record.category_id,
      source_mode: record.spec_item_id ? 'library' : 'manual',
      library_spec_group_id: matchedGroup?.id,
      library_spec_item_id: record.spec_item_id,
      spec_type: record.spec_type,
      spec_value: record.spec_value,
      price_delta: record.price_delta,
      sort: record.sort,
    })
    setModalOpen(true)
  }

  const onModalOk = async () => {
    const values = await form.validateFields()
    const selectedGroup = libraryGroups.find((item) => item.id === values.library_spec_group_id)
    const selectedItem = libraryItems.find((item) => item.id === values.library_spec_item_id)
    const payload = {
      category_id: String(values.category_id),
      spec_item_id: selectedSourceMode === 'library' ? String(values.library_spec_item_id) : undefined,
      spec_type: selectedSourceMode === 'library' ? selectedGroup?.name ?? '' : values.spec_type,
      spec_value: selectedSourceMode === 'library' ? selectedItem?.name ?? '' : values.spec_value,
      price_delta: Number(values.price_delta) || 0,
      sort: Number(values.sort) || 0,
    }

    try {
      if (editingId == null) {
        await createCategorySpec(payload)
        message.success('创建成功')
      } else {
        await updateCategorySpec(editingId, payload)
        message.success('更新成功')
      }
      setModalOpen(false)
      load()
    } catch (error) {
      const action = editingId == null ? '创建' : '更新'
      message.error(`${action}失败${extractErrorMessage(error) ? `：${extractErrorMessage(error)}` : ''}`)
    }
  }

  const openImport = async () => {
    if (!canEditMenu) {
      message.warning('当前账号没有菜单编辑权限')
      return
    }
    await Promise.all([loadCategories(), loadLibraryGroups()])
    importForm.resetFields()
    importForm.setFieldsValue({
      category_id: categoryFilter,
      spec_group_ids: [],
    })
    setImportItems([])
    setImportModalOpen(true)
  }

  const handleImportGroupsChange = async (groupIds: string[]) => {
    importForm.setFieldValue('spec_group_ids', groupIds)
    if (groupIds.length === 0) {
      setImportItems([])
      return
    }

    try {
      const responses = await Promise.all(
        groupIds.map((groupId) =>
          listSpecItems({
            current: 1,
            pageSize: 200,
            spec_group_id: groupId,
          })
        )
      )
      const items = responses.flatMap((res, index) => {
        const groupId = groupIds[index]
        const groupName = libraryGroups.find((group) => group.id === groupId)?.name ?? '未命名规格'
        return asArray(res?.items).map((item) => ({
          spec_group_id: groupId,
          spec_group_name: groupName,
          spec_item_id: item.id,
          spec_value: item.name,
          price_delta: item.default_price,
        }))
      })
      setImportItems(items)
    } catch {
      message.error('加载规格库预览失败')
      setImportItems([])
    }
  }

  const onImportOk = async () => {
    const values = await importForm.validateFields()
    const categoryId = String(values.category_id)
    try {
      const existing = await listCategorySpecs({
        current: 1,
        pageSize: 500,
        category_id: categoryId,
      })
      const existingItemIds = new Set(
        asArray(existing?.specs)
          .map((item) => item.spec_item_id)
          .filter((item): item is string => Boolean(item))
      )
      const existingPairs = new Set(asArray(existing?.specs).map((item) => `${item.spec_type}::${item.spec_value}`))
      const pendingItems = importItems.filter(
        (item) => !existingItemIds.has(item.spec_item_id) && !existingPairs.has(`${item.spec_group_name}::${item.spec_value}`)
      )

      if (pendingItems.length === 0) {
        message.info('所选规格项已全部存在，无需导入')
        setImportModalOpen(false)
        return
      }

      await Promise.all(
        pendingItems.map((item, index) =>
          createCategorySpec({
            category_id: categoryId,
            spec_item_id: item.spec_item_id,
            spec_type: item.spec_group_name,
            spec_value: item.spec_value,
            price_delta: item.price_delta,
            sort: index,
          })
        )
      )

      message.success(`已导入 ${pendingItems.length} 条分类规格`)
      setImportModalOpen(false)
      setCategoryFilter(categoryId)
      load()
    } catch (error) {
      message.error(`导入失败${extractErrorMessage(error) ? `：${extractErrorMessage(error)}` : ''}`)
    }
  }

  const onDelete = async (id: string) => {
    if (!canEditMenu) {
      message.warning('当前账号没有菜单编辑权限')
      return
    }
    try {
      await deleteCategorySpec(id)
      message.success('已删除')
      load()
    } catch (error) {
      message.error(`删除失败${extractErrorMessage(error) ? `：${extractErrorMessage(error)}` : ''}`)
    }
  }

  const selectedCategory = categories.find((item) => item.id === categoryFilter)
  const sortedSpecTemplateCategories = useMemo(() => sortMenuCategoriesForDisplay(categories), [categories])

  const specTemplateCategorySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const categoryCountMap = useMemo(() => {
    const map = new Map<string, number>()
    list.forEach((item) => {
      map.set(item.category_id, (map.get(item.category_id) ?? 0) + 1)
    })
    return map
  }, [list])

  const onSpecTemplateCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || String(active.id) === String(over.id)) return
    const oldIndex = sortedSpecTemplateCategories.findIndex((c) => c.id === String(active.id))
    const newIndex = sortedSpecTemplateCategories.findIndex((c) => c.id === String(over.id))
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = arrayMove(sortedSpecTemplateCategories, oldIndex, newIndex)
    const withSort = reordered.map((c, index) => ({ ...c, sort: index }))
    const snapshot = [...categories]
    setCategories(withSort)
    try {
      await Promise.all(
        withSort.map((c) =>
          updateMenuCategory(c.id, {
            name: c.name,
            description: c.description ?? '',
            sort: c.sort ?? 0,
          }),
        ),
      )
    } catch {
      message.error('保存排序失败')
      setCategories(snapshot)
    }
  }

  return (
    <div className="manage-shell">
    <Card className="manage-panel-card spec-template-hero-card">
        <div className="spec-template-hero">
          <div className="spec-template-hero-main">
            <Typography.Title level={4} style={{ margin: 0 }}>
              分类规格模板
            </Typography.Title>
            <Typography.Text type="secondary">
              为每个菜单分类沉淀一套可复用的规格模板，菜品创建时可一键勾选引用。
            </Typography.Text>
          </div>
          <Space wrap>
            <Button onClick={openImport} disabled={!canEditMenu}>
              批量导入规格组
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={!canEditMenu}>
              新增规格项
            </Button>
          </Space>
        </div>

        <div className="spec-template-stats">
          <div className="spec-template-stat">
            <span className="spec-template-stat-label">当前分类模板</span>
            <span className="spec-template-stat-value">{total}</span>
          </div>
          <div className="spec-template-stat">
            <span className="spec-template-stat-label">规格组数量</span>
            <span className="spec-template-stat-value">{groupedSpecs.length}</span>
          </div>
          <div className="spec-template-stat">
            <span className="spec-template-stat-label">已配置分类</span>
            <span className="spec-template-stat-value">{categoryCountMap.size}</span>
          </div>
        </div>
      </Card>

      <div className="spec-template-layout">
        <Card className="manage-panel-card spec-template-side">
          <div className="spec-template-side-header">
            <Typography.Text strong>菜单分类</Typography.Text>
            <Tag>{categories.length}</Tag>
          </div>
          <div className="spec-template-side-list">
            {categories.length === 0 ? (
              <Empty className="table-empty-state" description="请先在「菜单分类」里创建分类" />
            ) : (
              <DndContext
                sensors={specTemplateCategorySensors}
                collisionDetection={closestCenter}
                onDragEnd={onSpecTemplateCategoryDragEnd}
              >
                <SortableContext items={sortedSpecTemplateCategories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  {sortedSpecTemplateCategories.map((item) => {
                    const count = categoryCountMap.get(item.id) ?? 0
                    const active = item.id === categoryFilter
                    return (
                      <SortableSpecTemplateCategoryRow
                        key={item.id}
                        item={item}
                        active={active}
                        count={count}
                        canEditMenu={canEditMenu}
                        onSelect={() => setCategoryFilter(item.id)}
                      />
                    )
                  })}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </Card>

        <Card className="manage-panel-card spec-template-detail">
          <div className="spec-template-detail-header">
            <div>
              <Typography.Title level={5} style={{ margin: 0 }}>
                {selectedCategory ? `${selectedCategory.name} 的规格模板` : '请选择左侧分类'}
              </Typography.Title>
              {selectedCategory ? (
                <Typography.Text type="secondary">
                  共 {total} 项，按规格组聚合展示；点击右侧按钮编辑或删除
                </Typography.Text>
              ) : null}
            </div>
            <Input.Search
              placeholder="按规格类型搜索"
              allowClear
              enterButton={<SearchOutlined />}
              className="spec-template-detail-search"
              onSearch={(value) => setSpecTypeFilter(value.trim() || undefined)}
              onChange={(event) => {
                if (!event.target.value) setSpecTypeFilter(undefined)
              }}
            />
          </div>

          {!selectedCategory ? (
            <Empty className="table-empty-state" description="从左侧挑选一个分类，查看它的规格模板" />
          ) : loading ? null : groupedSpecs.length === 0 ? (
            <Empty
              className="table-empty-state"
              description={
                <Space direction="vertical" size={4} style={{ alignItems: 'center' }}>
                  <span>该分类还没有任何规格模板</span>
                  <Space>
                    <Button size="small" onClick={openImport} disabled={!canEditMenu}>
                      批量导入
                    </Button>
                    <Button size="small" type="primary" onClick={openCreate} disabled={!canEditMenu}>
                      新增规格项
                    </Button>
                  </Space>
                </Space>
              }
            />
          ) : (
            <div className="spec-template-group-list">
              {groupedSpecs.map((group) => (
                <div key={group.specType} className="spec-template-group">
                  <div className="spec-template-group-header">
                    <div className="spec-template-group-title">
                      <span className="spec-template-group-dot" />
                      <Typography.Title level={5} style={{ margin: 0 }}>
                        {group.specType}
                      </Typography.Title>
                      <Tag>{group.items.length} 项</Tag>
                    </div>
                  </div>
                  <div className="spec-template-chip-grid">
                    {group.items.map((record) => (
                      <div key={record.id} className="spec-template-chip">
                        <div className="spec-template-chip-main">
                          <Typography.Text strong className="spec-template-chip-name">
                            {record.spec_value}
                          </Typography.Text>
                          <div className="spec-template-chip-meta">
                            <Tag color={record.price_delta ? 'red' : 'default'} bordered={false}>
                              {record.price_delta ? `+¥${Number(record.price_delta).toFixed(2)}` : '不加价'}
                            </Tag>
                            <Tag color={record.spec_item_id ? 'cyan' : 'default'} bordered={false}>
                              {record.spec_item_id ? '全局引用' : '手动补录'}
                            </Tag>
                            <span className="spec-template-chip-sort">排序 {record.sort}</span>
                          </div>
                        </div>
                        <div className="spec-template-chip-actions">
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => openEdit(record)}
                            disabled={!canEditMenu}
                          />
                          <Popconfirm title="确定删除该规格项？" onConfirm={() => onDelete(record.id)} disabled={!canEditMenu}>
                            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                          </Popconfirm>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal
        className="manage-modal"
        title={renderManageModalTitle(
          editingId == null ? '新建分类规格' : '编辑分类规格',
          '把可复用规格绑定到菜单分类，方便菜品批量继承。'
        )}
        open={modalOpen}
        onOk={onModalOk}
        onCancel={() => setModalOpen(false)}
        okButtonProps={{ disabled: !canEditMenu }}
        okText="保存"
        cancelText="取消"
        centered
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Typography.Text className="modal-note">
            优先选择全局规格项。
          </Typography.Text>
          <div className="manage-form-card">
            <Form.Item name="category_id" label="所属分类" rules={[{ required: true, message: '请选择分类' }]}>
              <Select placeholder="请选择分类" options={categories.map((item) => ({ label: item.name, value: item.id }))} />
            </Form.Item>
            <span className="manage-form-card-title">录入方式</span>
            <Segmented
              className="category-spec-mode-switch"
              block
              value={selectedSourceMode}
              options={[
                { label: '选择全局规格项', value: 'library' },
                { label: '手动补录', value: 'manual' },
              ]}
              onChange={(value) => {
                form.setFieldValue('source_mode', value)
                if (value === 'library') {
                  form.setFieldValue('spec_type', undefined)
                  form.setFieldValue('spec_value', undefined)
                } else {
                  form.setFieldValue('library_spec_group_id', undefined)
                  form.setFieldValue('library_spec_item_id', undefined)
                }
              }}
            />
            {selectedSourceMode === 'library' ? (
              <div className="category-spec-picker-card">
                <div className="manage-form-grid">
                  <Form.Item
                    name="library_spec_group_id"
                    label="全局规格组"
                    rules={[{ required: true, message: '请选择规格组' }]}
                    preserve={false}
                  >
                    <Select
                      placeholder="先选择规格组"
                      options={libraryGroups.map((item) => ({ label: item.name, value: item.id }))}
                      onChange={() => {
                        form.setFieldValue('library_spec_item_id', undefined)
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="library_spec_item_id"
                    label="全局规格项"
                    rules={[{ required: true, message: '请选择规格项' }]}
                    preserve={false}
                  >
                    <Select
                      placeholder={selectedLibraryGroupId ? '再选择规格项' : '请先选择规格组'}
                      disabled={!selectedLibraryGroupId}
                      options={libraryItems.map((item) => ({
                        label: `${item.name}${item.default_price ? `  (+¥${Number(item.default_price).toFixed(2)})` : ''}`,
                        value: item.id,
                      }))}
                      onChange={(value) => {
                        const selectedItem = libraryItems.find((item) => item.id === value)
                        const selectedGroup = libraryGroups.find((item) => item.id === selectedLibraryGroupId)
                        form.setFieldsValue({
                          spec_type: selectedGroup?.name,
                          spec_value: selectedItem?.name,
                          price_delta: selectedItem?.default_price ?? 0,
                        })
                      }}
                    />
                  </Form.Item>
                  <Form.Item name="price_delta" label="分类默认加价">
                    <Input type="number" step={0.01} min={0} placeholder="0.00" />
                  </Form.Item>
                  <Form.Item name="sort" label="排序">
                    <Input type="number" min={0} placeholder="0" />
                  </Form.Item>
                </div>
              </div>
            ) : (
              <div className="category-spec-manual-card">
                <div className="manage-form-grid">
                  <Form.Item
                    name="spec_type"
                    label="规格类型"
                    rules={[{ required: true, message: '请输入规格类型' }]}
                    preserve={false}
                  >
                    <Input placeholder="如：辣度" />
                  </Form.Item>
                  <Form.Item
                    name="spec_value"
                    label="规格选项"
                    rules={[{ required: true, message: '请输入规格选项' }]}
                    preserve={false}
                  >
                    <Input placeholder="如：微辣" />
                  </Form.Item>
                  <Form.Item name="price_delta" label="默认加价">
                    <Input type="number" step={0.01} min={0} placeholder="0.00" />
                  </Form.Item>
                  <Form.Item name="sort" label="排序">
                    <Input type="number" min={0} placeholder="0" />
                  </Form.Item>
                </div>
              </div>
            )}
          </div>
        </Form>
      </Modal>

      <Modal
        className="manage-modal"
        title={renderManageModalTitle('从基础规格库导入', '选择基础规格组后，一次性导入到目标分类。')}
        open={importModalOpen}
        onOk={onImportOk}
        onCancel={() => setImportModalOpen(false)}
        okButtonProps={{ disabled: !canEditMenu || importItems.length === 0 }}
        okText="导入"
        cancelText="取消"
        centered
        width={720}
        destroyOnClose
      >
        <Form form={importForm} layout="vertical" style={{ marginTop: 16 }}>
          <Typography.Text className="modal-note">
            选择规格组后批量导入。
          </Typography.Text>
          <div className="manage-form-card">
            <Form.Item name="category_id" label="目标分类" rules={[{ required: true, message: '请选择分类' }]}>
              <Select placeholder="请选择分类" options={categories.map((item) => ({ label: item.name, value: item.id }))} />
            </Form.Item>
            <Form.Item name="spec_group_ids" label="导入规格组" rules={[{ required: true, message: '请选择至少一个规格组' }]}>
              <Select
                mode="multiple"
                placeholder="选择要导入的规格组"
                options={libraryGroups.map((item) => ({ label: item.name, value: item.id }))}
                onChange={(value) => void handleImportGroupsChange(value)}
              />
            </Form.Item>
          </div>

          <div className="manage-form-card">
            <span className="manage-form-card-title">导入预览</span>
            {importItems.length === 0 ? (
              <Typography.Text type="secondary">选择规格组后，这里会展示将要导入的规格模板。</Typography.Text>
            ) : (
              <div className="inline-editor-list">
                {importItems.map((item) => (
                  <div key={`${item.spec_item_id}-${item.spec_value}`} className="manage-spec-option-card">
                    <Space wrap>
                      <Tag color="blue">{item.spec_group_name}</Tag>
                      <Typography.Text strong>{item.spec_value}</Typography.Text>
                      <Tag color={item.price_delta ? 'red' : 'default'}>
                        ¥{Number(item.price_delta || 0).toFixed(2)}
                      </Tag>
                    </Space>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Form>
      </Modal>
    </div>
  )
}

function SpecGroupTab() {
  const { can } = useAuth()
  const canEditMenu = can('menu:edit')
  const [list, setList] = useState<SpecGroup[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [nameSearch, setNameSearch] = useState<string | undefined>()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingItemIds, setEditingItemIds] = useState<string[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>()
  const [selectedGroupItems, setSelectedGroupItems] = useState<SpecItem[]>([])
  const [form] = Form.useForm()
  const pageSize = 10

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listSpecGroups({
        current: page,
        pageSize,
        name: nameSearch,
      })
      setList(asArray(res?.groups))
      setTotal(Number(res?.total) || 0)
    } catch {
      message.error('加载规格组失败')
    } finally {
      setLoading(false)
    }
  }, [nameSearch, page])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (list.length === 0) {
      setSelectedGroupId(undefined)
      setSelectedGroupItems([])
      return
    }
    if (!selectedGroupId || !list.some((item) => item.id === selectedGroupId)) {
      setSelectedGroupId(list[0].id)
    }
  }, [list, selectedGroupId])

  const loadSelectedGroupItems = useCallback(async (groupId?: string) => {
    if (!groupId) {
      setSelectedGroupItems([])
      return
    }
    setItemsLoading(true)
    try {
      const res = await listSpecItems({
        current: 1,
        pageSize: 200,
        spec_group_id: groupId,
      })
      setSelectedGroupItems(asArray(res?.items))
    } catch {
      setSelectedGroupItems([])
      message.error('加载规格项失败')
    } finally {
      setItemsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSelectedGroupItems(selectedGroupId)
  }, [loadSelectedGroupItems, selectedGroupId])

  const selectedGroup = list.find((item) => item.id === selectedGroupId)

  const openCreate = () => {
    if (!canEditMenu) {
      message.warning('当前账号没有菜单编辑权限')
      return
    }
    setEditingId(null)
    setEditingItemIds([])
    form.resetFields()
    form.setFieldsValue({
      items: [{ name: '', default_price: 0 }],
    })
    setModalOpen(true)
  }

  const openEdit = async (record: SpecGroup) => {
    if (!canEditMenu) {
      message.warning('当前账号没有菜单编辑权限')
      return
    }
    try {
      const res = await listSpecItems({
        current: 1,
        pageSize: 200,
        spec_group_id: record.id,
      })
      const items = asArray(res?.items)
      setEditingId(record.id)
      setEditingItemIds(items.map((item) => item.id))
      form.setFieldsValue({
        name: record.name,
        sort: record.sort,
        items: items.length
          ? items.map((item) => ({
              id: item.id,
              name: item.name,
              default_price: item.default_price,
            }))
          : [{ name: '', default_price: 0 }],
      })
      setModalOpen(true)
    } catch {
      message.error('加载规格组详情失败')
    }
  }

  const onModalOk = async () => {
    const values = await form.validateFields()
    type SpecGroupItemFormValue = {
      id?: string
      name?: string
      default_price?: number | string
    }
    const payload = {
      name: values.name,
      sort: Number(values.sort) || 0,
    }
    const items = asArray(values.items as SpecGroupItemFormValue[])
      .map((item) => ({
        id: item?.id ? String(item.id) : undefined,
        name: String(item?.name ?? '').trim(),
        default_price: Number(item?.default_price) || 0,
      }))
      .filter((item) => item.name)

    try {
      let groupId = editingId
      if (editingId == null) {
        await createSpecGroup(payload)
        const created = await listSpecGroups({
          current: 1,
          pageSize: 1,
          name: payload.name,
        })
        const createdGroup = asArray(created?.groups).find((item) => item.name === payload.name) ?? asArray(created?.groups)[0]
        if (createdGroup == null) {
          throw new Error('规格组创建成功但未获取到新记录')
        }
        groupId = createdGroup.id
      } else {
        await updateSpecGroup(editingId, payload)
      }

      if (groupId) {
        const submittedExistingIds = new Set(items.filter((item) => item.id).map((item) => item.id as string))
        const deletedIds = editingItemIds.filter((id) => !submittedExistingIds.has(id))

        await Promise.all(deletedIds.map((id) => deleteSpecItem(id)))

        await Promise.all(
          items.map((item) =>
            item.id
              ? updateSpecItem(item.id, {
                  spec_group_id: groupId,
                  name: item.name,
                  default_price: item.default_price,
                })
              : createSpecItem({
                  spec_group_id: groupId,
                  name: item.name,
                  default_price: item.default_price,
                })
          )
        )
      }

      message.success(editingId == null ? '创建成功' : '更新成功')
      setModalOpen(false)
      setEditingItemIds([])
      load()
    } catch (error) {
      const action = editingId == null ? '创建' : '更新'
      message.error(`${action}失败${extractErrorMessage(error) ? `：${extractErrorMessage(error)}` : ''}`)
    }
  }

  const onDelete = async (id: string) => {
    if (!canEditMenu) {
      message.warning('当前账号没有菜单编辑权限')
      return
    }
    try {
      await deleteSpecGroup(id)
      message.success('已删除')
      load()
    } catch (error) {
      message.error(`删除失败${extractErrorMessage(error) ? `：${extractErrorMessage(error)}` : ''}`)
    }
  }

  const handleSearch = (value: string) => {
    setNameSearch(value.trim() || undefined)
    setPage(1)
  }

  return (
    <div className="manage-shell">
      <div className="manage-library-layout">
        <Card className="manage-panel-card">
          <div className="manage-filter-bar">
            <div className="manage-filter-group">
              <Input.Search
                placeholder="搜索规格组名称"
                allowClear
                enterButton={<SearchOutlined />}
                style={{ width: 260 }}
                onSearch={handleSearch}
                onChange={(event) => {
                  if (!event.target.value) {
                    setNameSearch(undefined)
                    setPage(1)
                  }
                }}
              />
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={!canEditMenu}>
              新建规格组
            </Button>
          </div>

          <div className="compact-summary-inline">
            <Tag color="blue">规格组总数 {total}</Tag>
            <Tag color="purple">本页显示 {list.length}</Tag>
            <Tag color="gold">基础规格库只负责维护通用维度</Tag>
          </div>

          <Table
            rowKey="id"
            loading={loading}
            dataSource={list}
            tableLayout="fixed"
            scroll={{ x: 980 }}
            locale={{
              emptyText: <Empty className="table-empty-state" description="暂无规格组，先创建一条吧" />,
            }}
            onRow={(record) => ({
              onClick: () => setSelectedGroupId(record.id),
            })}
            rowClassName={(record) => (record.id === selectedGroupId ? 'manage-table-row-active' : '')}
            columns={[
              {
                title: '规格组',
                dataIndex: 'name',
                ellipsis: true,
                render: (value: string, record: SpecGroup) => (
                  <Space>
                    <Tag color={record.id === selectedGroupId ? 'processing' : 'blue'}>{value}</Tag>
                    <Typography.Text type="secondary">排序 {record.sort}</Typography.Text>
                  </Space>
                ),
              },
              {
                title: '创建时间',
                dataIndex: 'created_at',
                width: 172,
                render: (value?: string | number) => formatDateTime(value),
              },
              {
                title: '操作',
                width: 168,
                fixed: 'right',
                className: 'table-col-actions',
                render: (_, record: SpecGroup) => (
                  <Space>
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => void openEdit(record)} disabled={!canEditMenu}>
                      编辑
                    </Button>
                    <Popconfirm title="确定删除该规格组？" onConfirm={() => onDelete(record.id)} disabled={!canEditMenu}>
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
              showTotal: (count) => `共 ${count} 条`,
              onChange: setPage,
            }}
          />
        </Card>

        <Card className="manage-panel-card manage-library-detail-card">
          <div className="manage-library-detail-head">
            <div className="manage-filter-bar manage-library-detail-toolbar">
              <div>
                {selectedGroup ? (
                  <div className="spec-template-group-title">
                    <span className="spec-template-group-dot" />
                    <Typography.Title level={5} style={{ margin: 0 }}>
                      {selectedGroup.name}
                    </Typography.Title>
                    <Tag>{selectedGroupItems.length} 项</Tag>
                  </div>
                ) : (
                  <Typography.Title level={5} style={{ margin: 0 }}>
                    规格项明细
                  </Typography.Title>
                )}
              </div>
              {selectedGroup ? (
                <Button type="primary" ghost onClick={() => void openEdit(selectedGroup)} disabled={!canEditMenu}>
                  编辑该规格组
                </Button>
              ) : null}
            </div>
            {selectedGroup ? (
              <Typography.Text type="secondary" className="manage-library-detail-hint">
                以下为当前组内规格项预览；新增、改价或排序请使用右上角「编辑该规格组」。
              </Typography.Text>
            ) : null}
          </div>

          <div className="manage-library-detail-body">
            {selectedGroup == null ? (
              <div className="manage-library-items-panel manage-library-items-panel--center">
                <Empty className="table-empty-state" description="请从左侧选择一个规格组查看明细" />
              </div>
            ) : itemsLoading ? (
              <div className="manage-library-items-panel manage-library-items-panel--center">
                <Space direction="vertical" align="center" size="middle">
                  <Spin size="large" />
                  <Typography.Text type="secondary">加载规格项…</Typography.Text>
                </Space>
              </div>
            ) : selectedGroupItems.length === 0 ? (
              <div className="manage-library-items-panel manage-library-items-panel--center">
                <Empty
                  className="table-empty-state"
                  description={
                    <Space direction="vertical" size={8} style={{ alignItems: 'center' }}>
                      <span>该规格组下还没有规格项</span>
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => void openEdit(selectedGroup)}
                        disabled={!canEditMenu}
                      >
                        批量添加规格项
                      </Button>
                    </Space>
                  }
                />
              </div>
            ) : (
              <div className="manage-library-items-panel">
                <div className="manage-library-items-grid">
                  {selectedGroupItems.map((item) => (
                    <div
                      key={item.id}
                      className="spec-template-chip manage-library-spec-chip"
                      title={`创建时间 ${formatDateTime(item.created_at)}`}
                    >
                      <div className="spec-template-chip-main">
                        <Typography.Text strong className="spec-template-chip-name">
                          {item.name}
                        </Typography.Text>
                        <div className="spec-template-chip-meta">
                          <Tag color={item.default_price ? 'red' : 'default'} bordered={false}>
                            {item.default_price ? `+¥${Number(item.default_price).toFixed(2)}` : '不加价'}
                          </Tag>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Modal
        className="manage-modal"
        title={renderManageModalTitle(
          editingId == null ? '新建规格组' : '编辑规格组',
          '沉淀通用规格维度，后续可被分类规格和菜品快速引用。'
        )}
        open={modalOpen}
        onOk={onModalOk}
        onCancel={() => setModalOpen(false)}
        okButtonProps={{ disabled: !canEditMenu }}
        okText="保存"
        cancelText="取消"
        centered
        width={760}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Typography.Text className="modal-note">
            规格组用于沉淀通用规格维度，如辣度、甜度、杯型。现在可以一次维护多个规格项。
          </Typography.Text>
          <div className="manage-form-card">
            <div className="manage-form-grid">
              <Form.Item name="name" label="规格组名称" rules={[{ required: true, message: '请输入规格组名称' }]}>
                <Input placeholder="如：辣度" />
              </Form.Item>
              <Form.Item name="sort" label="排序">
                <Input type="number" min={0} placeholder="0" />
              </Form.Item>
            </div>
            <Form.Item label="规格项列表" style={{ marginBottom: 0 }}>
              <Form.List name="items">
                {(fields, { add, remove }) => (
                  <div className="inline-editor-list">
                    {fields.map(({ key, name, ...rest }) => (
                      <div key={key} className="inline-editor-row">
                        <Form.Item {...rest} name={[name, 'id']} hidden>
                          <Input />
                        </Form.Item>
                        <Form.Item {...rest} name={[name, 'name']} label="规格项名称" rules={[{ required: true, message: '请输入规格项名称' }]}>
                          <Input placeholder="如：微辣 / 重辣 / 大杯" />
                        </Form.Item>
                        <Form.Item {...rest} name={[name, 'default_price']} label="默认价格">
                          <Input type="number" step={0.01} min={0} placeholder="0.00" />
                        </Form.Item>
                        <Button type="text" danger onClick={() => remove(name)}>
                          删除
                        </Button>
                      </div>
                    ))}
                    <Button type="dashed" onClick={() => add({ name: '', default_price: 0 })} block>
                      + 添加规格项
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

type CustomMenuSpecItemFormValue = {
  spec_value?: string
  price_delta?: number | string
}

type CustomMenuSpecGroupFormValue = {
  spec_type?: string
  items?: CustomMenuSpecItemFormValue[]
}

function sortMenuCategoriesForDisplay(list: MenuCategory[]): MenuCategory[] {
  const withSort = list.map((c) => ({ ...c, sort: c.sort ?? 0 }))
  return [...withSort].sort((a, b) => {
    if (a.sort !== b.sort) return a.sort - b.sort
    const idA = Number.parseInt(String(a.id), 10)
    const idB = Number.parseInt(String(b.id), 10)
    if (Number.isFinite(idA) && Number.isFinite(idB) && idA !== idB) return idA - idB
    return String(a.id).localeCompare(String(b.id))
  })
}

type SortableMenuCategoryRowProps = {
  item: MenuCategory
  active: boolean
  canEditMenu: boolean
  onSelect: () => void
  onEdit: (record: MenuCategory) => void
  onDelete: (record: MenuCategory) => void
}

function SortableMenuCategoryRow({
  item,
  active,
  canEditMenu,
  onSelect,
  onEdit,
  onDelete,
}: SortableMenuCategoryRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !canEditMenu,
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
      className={`menu-workspace-side-item${active ? ' menu-workspace-side-item-active' : ''}${isDragging ? ' menu-workspace-side-item-dragging' : ''}`}
    >
      <button
        type="button"
        className={`menu-workspace-side-drag-handle${!canEditMenu ? ' menu-workspace-side-drag-handle-disabled' : ''}`}
        aria-label="拖动排序"
        {...(canEditMenu ? attributes : {})}
        {...(canEditMenu ? listeners : {})}
        tabIndex={canEditMenu ? 0 : -1}
        onClick={(e) => e.stopPropagation()}
      >
        <HolderOutlined />
      </button>
      <button type="button" className="menu-workspace-side-item-btn" onClick={onSelect}>
        <span className="menu-workspace-side-item-name">{item.name}</span>
      </button>
      <span className="menu-workspace-side-item-actions">
        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(item)} disabled={!canEditMenu} />
        <Popconfirm title="确定删除该分类？" onConfirm={() => onDelete(item)} disabled={!canEditMenu}>
          <Button type="text" size="small" danger icon={<DeleteOutlined />} disabled={!canEditMenu} />
        </Popconfirm>
      </span>
    </div>
  )
}

type SortableSpecTemplateCategoryRowProps = {
  item: MenuCategory
  active: boolean
  count: number
  canEditMenu: boolean
  onSelect: () => void
}

function SortableSpecTemplateCategoryRow({
  item,
  active,
  count,
  canEditMenu,
  onSelect,
}: SortableSpecTemplateCategoryRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !canEditMenu,
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
      className={`spec-template-side-item spec-template-side-item-with-handle${active ? ' spec-template-side-item-active' : ''}${isDragging ? ' spec-template-side-item-dragging' : ''}`}
    >
      <button
        type="button"
        className={`spec-template-side-drag-handle${!canEditMenu ? ' spec-template-side-drag-handle-disabled' : ''}`}
        aria-label="拖动排序"
        {...(canEditMenu ? attributes : {})}
        {...(canEditMenu ? listeners : {})}
        tabIndex={canEditMenu ? 0 : -1}
        onClick={(e) => e.stopPropagation()}
      >
        <HolderOutlined />
      </button>
      <button type="button" className="spec-template-side-item-body" onClick={onSelect}>
        <span className="spec-template-side-item-name">{item.name}</span>
        <span className="spec-template-side-item-count">{count} 项</span>
      </button>
    </div>
  )
}

function groupCustomMenuSpecs(specs: MenuSpec[] | undefined): CustomMenuSpecGroupFormValue[] {
  const grouped = new Map<string, CustomMenuSpecGroupFormValue>()
  asArray(specs).forEach((item) => {
    if (item.category_spec_id || item.spec_item_id) return
    const specType = item.spec_type?.trim()
    const specValue = item.spec_value?.trim()
    if (!specType || !specValue) return
    if (!grouped.has(specType)) {
      grouped.set(specType, { spec_type: specType, items: [] })
    }
    grouped.get(specType)!.items!.push({
      spec_value: specValue,
      price_delta: item.price_delta,
    })
  })
  return Array.from(grouped.values())
}

function buildMenuSpecsFromForm(values: {
  selected_category_spec_ids?: string[]
  selected_library_spec_item_ids?: string[]
  custom_spec_groups?: CustomMenuSpecGroupFormValue[]
}, categorySpecs: CategorySpec[], libraryItems: SpecItem[], libraryGroups: SpecGroup[]): MenuSpec[] {
  const categorySpecMap = new Map(categorySpecs.map((item) => [item.id, item]))
  const libraryItemMap = new Map(libraryItems.map((item) => [item.id, item]))
  const libraryGroupMap = new Map(libraryGroups.map((item) => [item.id, item]))
  const specs: MenuSpec[] = []
  let sort = 0

  // 用 spec_type::spec_value 做跨分区去重键，防止 category / library / custom 三区产生重复条目
  const coveredKeys = new Set<string>()

  asArray(values.selected_category_spec_ids).forEach((categorySpecId) => {
    const matched = categorySpecMap.get(String(categorySpecId))
    const key = matched ? `${matched.spec_type}::${matched.spec_value}` : ''
    if (key && coveredKeys.has(key)) return
    if (key) coveredKeys.add(key)
    specs.push({
      source: 'category',
      category_spec_id: String(categorySpecId),
      spec_type: matched?.spec_type,
      spec_value: matched?.spec_value,
      price_delta: normalizeMoneyYuan(matched?.price_delta ?? 0),
      sort,
    })
    sort += 1
  })

  asArray(values.selected_library_spec_item_ids).forEach((specItemId) => {
    const matched = libraryItemMap.get(String(specItemId))
    const group = matched ? libraryGroupMap.get(matched.spec_group_id) : undefined
    const key = group?.name && matched?.name ? `${group.name}::${matched.name}` : ''
    if (key && coveredKeys.has(key)) return
    if (key) coveredKeys.add(key)
    specs.push({
      source: 'library',
      spec_item_id: String(specItemId),
      spec_type: group?.name,
      spec_value: matched?.name,
      price_delta: normalizeMoneyYuan(matched?.default_price ?? 0),
      sort,
    })
    sort += 1
  })

  asArray(values.custom_spec_groups).forEach((group) => {
    const specType = group.spec_type?.trim()
    if (!specType) return
    asArray(group.items).forEach((item) => {
      const specValue = item.spec_value?.trim()
      if (!specValue) return
      const key = `${specType}::${specValue}`
      if (coveredKeys.has(key)) return
      coveredKeys.add(key)
      specs.push({
        source: 'custom',
        spec_type: specType,
        spec_value: specValue,
        price_delta: normalizeMoneyYuan(item.price_delta ?? 0),
        sort,
      })
      sort += 1
    })
  })

  return specs
}

function MenuListTab({ onOpenCategorySpecs }: { onOpenCategorySpecs?: (categoryId?: string) => void }) {
  const { can } = useAuth()
  const canEditMenu = can('menu:edit')
  const [menus, setMenus] = useState<Menu[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [categorySpecs, setCategorySpecs] = useState<CategorySpec[]>([])
  const [libraryGroups, setLibraryGroups] = useState<SpecGroup[]>([])
  const [libraryItems, setLibraryItems] = useState<SpecItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>()
  const [nameSearch, setNameSearch] = useState<string | undefined>()
  const pageSize = 10
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm()
  const selectedCategoryId = Form.useWatch('category_id', form)
  const [selectedCategorySpecIds, setSelectedCategorySpecIds] = useState<string[]>([])
  const [selectedLibrarySpecItemIds, setSelectedLibrarySpecItemIds] = useState<string[]>([])

  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [categoryForm] = Form.useForm()
  /** 新建/编辑弹窗打开时，保证 afterOpenChange 能拿到本次点击的分类（避免 state 尚未提交） */
  const categoryEditSnapshotRef = useRef<MenuCategory | null>(null)

  const loadCategories = useCallback(async () => {
    const res = await listMenuCategories({ current: 1, pageSize: 200 })
    setCategories(asArray(res?.categories))
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
      setMenus(asArray(res?.menus))
      setTotal(Number(res?.total) || 0)
    } catch {
      message.error('加载菜品列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, categoryFilter, nameSearch])

  const loadLibrarySpecs = useCallback(async () => {
    try {
      const groupsRes = await listSpecGroups({ current: 1, pageSize: 500 })
      const groups = asArray(groupsRes?.groups)
      setLibraryGroups(groups)
      if (groups.length === 0) {
        setLibraryItems([])
        return
      }
      const itemsRes = await Promise.all(
        groups.map((group) =>
          listSpecItems({
            current: 1,
            pageSize: 500,
            spec_group_id: group.id,
          })
        )
      )
      setLibraryItems(itemsRes.flatMap((res) => asArray(res?.items)))
    } catch {
      setLibraryGroups([])
      setLibraryItems([])
      message.error('加载全局规格库失败')
    }
  }, [])

  const loadCategorySpecs = useCallback(async (categoryId?: string) => {
    if (!categoryId) {
      setCategorySpecs([])
      return
    }
    try {
      const res = await listCategorySpecs({
        current: 1,
        pageSize: 500,
        category_id: categoryId,
      })
      setCategorySpecs(asArray(res?.specs))
    } catch {
      setCategorySpecs([])
      message.error('加载分类规格失败')
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    loadMenus()
  }, [loadMenus])

  useEffect(() => {
    if (!modalOpen) {
      setCategorySpecs([])
      return
    }
    void loadCategorySpecs(selectedCategoryId)
  }, [loadCategorySpecs, modalOpen, selectedCategoryId])

  const categoryMap = Object.fromEntries(categories.map((item) => [item.id, item.name]))
  const sortedCategories = useMemo(() => sortMenuCategoriesForDisplay(categories), [categories])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const categorySpecsByType = useMemo(() => {
    const groups = new Map<string, CategorySpec[]>()
    categorySpecs.forEach((item) => {
      const key = item.spec_type || '未命名规格'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(item)
    })
    return Array.from(groups.entries())
      .map(([specType, items]) => ({
        specType,
        items: [...items].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)),
      }))
      .sort((a, b) => {
        const ak = a.items[0]?.sort ?? 0
        const bk = b.items[0]?.sort ?? 0
        if (ak !== bk) return ak - bk
        return a.specType.localeCompare(b.specType, 'zh-CN')
      })
  }, [categorySpecs])
  const librarySpecsByType = useMemo(() => {
    const groupNameMap = new Map(libraryGroups.map((item) => [item.id, item.name]))
    const byName = new Map<string, SpecItem[]>()
    libraryItems.forEach((item) => {
      const key = groupNameMap.get(item.spec_group_id) || '未命名规格'
      if (!byName.has(key)) byName.set(key, [])
      byName.get(key)!.push(item)
    })
    const rows: { specType: string; items: SpecItem[] }[] = []
    ;[...libraryGroups]
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
      .forEach((g) => {
        const raw = byName.get(g.name)
        if (!raw?.length) return
        byName.delete(g.name)
        rows.push({
          specType: g.name,
          items: [...raw].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
        })
      })
    Array.from(byName.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))
      .forEach(([specType, items]) => {
        rows.push({
          specType,
          items: [...items].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
        })
      })
    return rows
  }, [libraryGroups, libraryItems])
  const allCategorySpecIds = useMemo(() => categorySpecs.map((item) => item.id), [categorySpecs])
  const allLibrarySpecItemIds = useMemo(() => libraryItems.map((item) => item.id), [libraryItems])
  const customSpecGroupsWatch = Form.useWatch('custom_spec_groups', form) as CustomMenuSpecGroupFormValue[] | undefined
  const customSpecGroupCount = useMemo(
    () =>
      asArray(customSpecGroupsWatch).filter(
        (g) =>
          Boolean(g?.spec_type?.trim()) && asArray(g?.items).some((i) => Boolean(i?.spec_value?.trim())),
      ).length,
    [customSpecGroupsWatch],
  )
  const menusWithoutImage = useMemo(() => menus.filter((item) => !item.image).length, [menus])
  const menusWithSpecs = useMemo(() => menus.filter((item) => (item.specs?.length ?? 0) > 0).length, [menus])

  const openCreate = async () => {
    if (!canEditMenu) {
      message.warning('当前账号没有菜单编辑权限')
      return
    }
    setEditingId(null)
    form.resetFields()
    form.setFieldValue('custom_spec_groups', [])
    setSelectedCategorySpecIds([])
    setSelectedLibrarySpecItemIds([])
    setCategorySpecs([])
    await Promise.all([loadCategories(), loadLibrarySpecs()])
    setModalOpen(true)
  }

  const openEdit = async (record: Menu) => {
    if (!canEditMenu) {
      message.warning('当前账号没有菜单编辑权限')
      return
    }
    setEditingId(record.id)
    try {
      const { menu } = await getMenu(record.id)
      await Promise.all([loadCategorySpecs(menu.category_id), loadLibrarySpecs()])
      const initCategorySpecIds = asArray(menu.specs)
        .filter((item) => item.source === 'category' || (!item.source && Boolean(item.category_spec_id)))
        .map((item) => item.category_spec_id)
        .filter((item): item is string => Boolean(item))
      const initLibrarySpecItemIds = asArray(menu.specs)
        .filter((item) => item.source === 'library' || (!item.source && !item.category_spec_id && Boolean(item.spec_item_id)))
        .map((item) => item.spec_item_id)
        .filter((item): item is string => Boolean(item))
      setSelectedCategorySpecIds(initCategorySpecIds)
      setSelectedLibrarySpecItemIds(initLibrarySpecItemIds)
      form.setFieldsValue({
        name: menu.name,
        price: menu.price,
        category_id: menu.category_id,
        description: menu.description ?? '',
        image: menu.image ?? '',
        custom_spec_groups: groupCustomMenuSpecs(menu.specs),
      })
      setModalOpen(true)
    } catch {
      message.error('获取菜品详情失败')
    }
  }

  const onModalOk = async () => {
    const values = await form.validateFields()

    // 后端 ensureGlobalSpecItem 会在保存菜品时自动将 custom 规格写入全局规格库（找或建 SpecGroup / SpecItem）
    // 此处无需前端手动调用 createSpecGroup / createSpecItem，直接构建 specs 提交即可
    const specs = buildMenuSpecsFromForm(
      { ...values, selected_category_spec_ids: selectedCategorySpecIds, selected_library_spec_item_ids: selectedLibrarySpecItemIds },
      categorySpecs,
      libraryItems,
      libraryGroups,
    )

    const hasCustomSpecs = asArray(values.custom_spec_groups as CustomMenuSpecGroupFormValue[]).some(
      (g) => g.spec_type?.trim() && asArray(g.items).some((i) => i.spec_value?.trim()),
    )

    try {
      const normalizedPrice = normalizeMoneyYuan(values.price)
      if (editingId == null) {
        await createMenu({
          name: values.name,
          price: normalizedPrice,
          category_id: String(values.category_id),
          description: values.description || undefined,
          image: values.image || undefined,
          specs: specs.length ? specs : undefined,
        })
        message.success('创建成功')
      } else {
        await updateMenu(editingId, {
          name: values.name,
          price: normalizedPrice,
          category_id: String(values.category_id),
          description: values.description || undefined,
          image: values.image || undefined,
          specs: specs.length ? specs : undefined,
        })
        message.success('更新成功')
      }
      setModalOpen(false)
      // 有 custom 规格时后端已写入全局库，重新拉取保证本地状态最新
      if (hasCustomSpecs) void loadLibrarySpecs()
      loadMenus()
    } catch (error) {
      const action = editingId == null ? '创建' : '更新'
      message.error(`${action}失败${extractErrorMessage(error) ? `：${extractErrorMessage(error)}` : ''}`)
    }
  }

  const onDelete = async (id: string) => {
    if (!canEditMenu) {
      message.warning('当前账号没有菜单编辑权限')
      return
    }
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
    setPage(1)
  }

  const openCategoryCreate = () => {
    if (!canEditMenu) {
      message.warning('当前账号没有菜单编辑权限')
      return
    }
    categoryEditSnapshotRef.current = null
    setEditingCategoryId(null)
    setCategoryModalOpen(true)
  }

  const openCategoryEdit = (record: MenuCategory) => {
    if (!canEditMenu) {
      message.warning('当前账号没有菜单编辑权限')
      return
    }
    categoryEditSnapshotRef.current = record
    setEditingCategoryId(record.id)
    setCategoryModalOpen(true)
  }

  const categorySortValue = (v: unknown) => {
    if (v == null || v === '') return 0
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }

  const onCategoryModalOk = async () => {
    const values = await categoryForm.validateFields()
    const sortNum = categorySortValue(values.sort)
    try {
      if (editingCategoryId == null) {
        await createMenuCategory({
          name: values.name,
          description: values.description || undefined,
          sort: sortNum,
        })
        message.success('创建成功')
      } else {
        await updateMenuCategory(editingCategoryId, {
          name: values.name,
          description: values.description ?? '',
          sort: sortNum,
        })
        message.success('更新成功')
      }
      setCategoryModalOpen(false)
      loadCategories()
    } catch {
      message.error(editingCategoryId == null ? '创建失败' : '更新失败')
    }
  }

  const onCategoryDelete = async (record: MenuCategory) => {
    if (!canEditMenu) {
      message.warning('当前账号没有菜单编辑权限')
      return
    }
    try {
      await deleteMenuCategory(record.id)
      message.success('已删除')
      if (categoryFilter === record.name) {
        setCategoryFilter(undefined)
        setPage(1)
      }
      loadCategories()
      loadMenus()
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
          updateMenuCategory(c.id, {
            name: c.name,
            description: c.description ?? '',
            sort: c.sort ?? 0,
          }),
        ),
      )
    } catch {
      message.error('保存排序失败')
      setCategories(snapshot)
    }
  }

  return (
    <>
      <div className="menu-workspace-layout">
        <Card className="manage-panel-card menu-workspace-side">
          <div className="menu-workspace-side-header">
            <Typography.Text strong>菜单分类</Typography.Text>
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={openCategoryCreate}
              disabled={!canEditMenu}
            />
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
              <span className="menu-workspace-side-item-name">全部菜品</span>
              <span className="menu-workspace-side-item-count">{total}</span>
            </button>
            {categories.length === 0 ? (
              <Empty className="menu-workspace-side-empty" description="还没有分类" />
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onCategoryDragEnd}>
                <SortableContext items={sortedCategories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  {sortedCategories.map((item) => (
                    <SortableMenuCategoryRow
                      key={item.id}
                      item={item}
                      active={categoryFilter === item.name}
                      canEditMenu={canEditMenu}
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
          <Card className="manage-table-card menu-workspace-menu-data-card">
            <div className="menu-workspace-menu-toolbar">
              <div className="manage-filter-bar menu-workspace-menu-filter">
                <div className="manage-filter-group">
                  <Input.Search
                    placeholder="搜索菜品名称"
                    allowClear
                    enterButton={<SearchOutlined />}
                    style={{ width: 260 }}
                    onSearch={handleSearch}
                    onChange={(event) => {
                      if (!event.target.value) {
                        setNameSearch(undefined)
                        setPage(1)
                      }
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
                  ) : null}
                </div>
                <Space wrap size={10}>
                  <Tooltip title="新标签打开全屏菜单展示，适合电视或投影">
                    <Button
                      className="menu-workspace-screen-btn"
                      icon={<FundProjectionScreenOutlined />}
                      href={appPath('/menu-screen')}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      菜单大屏
                    </Button>
                  </Tooltip>
                  <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={!canEditMenu}>
                    新建菜品
                  </Button>
                </Space>
              </div>
              <div className="compact-summary-inline compact-summary-inline--dense">
                <Tag color="blue">菜品总数 {total}</Tag>
                <Tag color="purple">本页显示 {menus.length}</Tag>
                <Tag color="orange">本页缺图 {menusWithoutImage}</Tag>
                <Tag color="gold">本页有规格 {menusWithSpecs}</Tag>
              </div>
            </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={menus}
          tableLayout="fixed"
          scroll={{ x: 1360 }}
          locale={{
            emptyText: <Empty className="table-empty-state" description="暂无菜品，先新增一道菜品吧" />,
          }}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 160, className: 'table-col-id' },
            {
              title: '图片',
              dataIndex: 'image',
              width: 80,
              render: (url: string | undefined) => {
                const normalized = normalizeImageUrl(url)
                return normalized ? (
                  <div className="table-thumb">
                    <Image
                      src={normalized}
                      alt=""
                      width={52}
                      height={52}
                      style={{ objectFit: 'cover' }}
                      fallback={MENU_IMAGE_FALLBACK}
                      preview={{ mask: '预览' }}
                      onError={(event) => {
                        const target = event.target as HTMLImageElement
                        target.onerror = null
                        target.src = MENU_IMAGE_FALLBACK
                      }}
                    />
                  </div>
                ) : (
                  <Tag>无图</Tag>
                )
              },
            },
            { title: '菜品名称', dataIndex: 'name', width: 160, ellipsis: true },
            {
              title: '价格',
              dataIndex: 'price',
              width: 88,
              className: 'table-col-amount',
              render: (value: number) => <Tag color="red">¥{value.toFixed(2)}</Tag>,
            },
            {
              title: '分类',
              dataIndex: 'category_id',
              width: 108,
              ellipsis: true,
              render: (id: string) => <Tag color="blue">{categoryMap[id] ?? id}</Tag>,
            },
            {
              title: '规格',
              dataIndex: 'specs',
              width: 280,
              render: (value?: MenuSpec[]) => {
                const grouped = new Map<string, string[]>()
                asArray(value).forEach((item) => {
                  const type = item.spec_type ?? '默认规格'
                  const specValue = item.spec_value ?? '默认'
                  if (!grouped.has(type)) grouped.set(type, [])
                  grouped.get(type)!.push(specValue)
                })
                return grouped.size === 0 ? (
                  '-'
                ) : (
                  <div className="menu-table-specs-cell">
                    {Array.from(grouped.entries()).map(([type, items]) => (
                      <div key={type} className="menu-table-specs-line">
                        <Typography.Text strong className="menu-table-specs-type">
                          {type}
                        </Typography.Text>
                        <span className="menu-table-specs-values">{items.join('、')}</span>
                      </div>
                    ))}
                  </div>
                )
              },
            },
            {
              title: '描述',
              dataIndex: 'description',
              width: 120,
              ellipsis: { showTitle: true },
              render: (value?: string) => value || '-',
            },
            {
              title: '创建时间',
              dataIndex: 'created_at',
              width: 156,
              className: 'table-col-datetime',
              render: (value?: string) => formatDateTime(value),
            },
            {
              title: '操作',
              width: 160,
              fixed: 'right',
              className: 'table-col-actions',
              render: (_, record: Menu) => (
                <Space>
                  <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} disabled={!canEditMenu}>
                    编辑
                  </Button>
                  <Popconfirm title="确定删除该菜品？" onConfirm={() => onDelete(record.id)} disabled={!canEditMenu}>
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
            showTotal: (count) => `共 ${count} 条`,
            onChange: setPage,
          }}
        />
          </Card>
        </div>
      </div>

      <Modal
        className="manage-modal"
        title={renderManageModalTitle(
          editingCategoryId == null ? '新建分类' : '编辑分类',
          '分类会影响菜单工作台展示顺序，也可继续维护分类规格。'
        )}
        open={categoryModalOpen}
        onCancel={() => setCategoryModalOpen(false)}
        afterOpenChange={(open) => {
          if (!open) return
          const snapshot = categoryEditSnapshotRef.current
          if (snapshot) {
            const record = categories.find((c) => c.id === snapshot.id) ?? snapshot
            categoryForm.setFieldsValue({
              name: record.name,
              description: record.description ?? '',
              sort: record.sort ?? 0,
            })
            categoryEditSnapshotRef.current = null
            return
          }
          categoryForm.resetFields()
          const sorts = categories.map((c) => c.sort ?? 0)
          const maxSort = sorts.length ? Math.max(...sorts) : -1
          categoryForm.setFieldsValue({ sort: maxSort + 1 })
        }}
        centered
        width={480}
        destroyOnClose
        footer={
          <div className="category-modal-footer">
            <span className="category-modal-footer-left">
              {editingCategoryId != null && onOpenCategorySpecs ? (
                <Button
                  type="link"
                  style={{ paddingInline: 0 }}
                  onClick={() => {
                    const id = editingCategoryId
                    setCategoryModalOpen(false)
                    onOpenCategorySpecs(id ?? undefined)
                  }}
                >
                  前往编辑分类规格 →
                </Button>
              ) : null}
            </span>
            <Space>
              <Button onClick={() => setCategoryModalOpen(false)}>取消</Button>
              <Button type="primary" onClick={onCategoryModalOk} disabled={!canEditMenu}>
                保存
              </Button>
            </Space>
          </div>
        }
      >
        <Form form={categoryForm} layout="vertical" style={{ marginTop: 12 }}>
          <Typography.Text className="modal-note">
            建议分类名称简短清晰，排序越小越靠前。
          </Typography.Text>
          <div className="manage-form-card">
            <span className="manage-form-card-title">分类信息</span>
            <Form.Item name="name" label="分类名称" rules={[{ required: true, message: '请输入分类名称' }]}>
              <Input placeholder="如：热菜" />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <Input.TextArea rows={3} placeholder="选填" />
            </Form.Item>
            <Form.Item name="sort" label="排序" extra="数字越小越靠前" style={{ marginBottom: 0 }}>
              <InputNumber min={0} step={1} style={{ width: '100%' }} placeholder="0" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        className="manage-modal menu-edit-modal"
        title={renderManageModalTitle(
          editingId == null ? '新建菜品' : '编辑菜品',
          '先完善基础信息，再按需配置分类规格、自定义规格组和价格。'
        )}
        open={modalOpen}
        onOk={onModalOk}
        onCancel={() => setModalOpen(false)}
        okButtonProps={{ disabled: !canEditMenu }}
        okText="保存"
        cancelText="取消"
        centered
        width={920}
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
                  onChange={() => {
                    form.setFieldValue('selected_category_spec_ids', [])
                  }}
                  options={categories.map((item) => ({ label: item.name, value: item.id }))}
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

          <div className="manage-form-card menu-edit-spec-card">
            <div className="menu-edit-spec-card-head">
              <span className="manage-form-card-title">规格配置</span>
              <Space size={8} wrap className="menu-edit-spec-summary">
                <Tag>
                  分类模板 {selectedCategorySpecIds.length}/{categorySpecs.length || 0}
                </Tag>
                <Tag color="cyan">
                  全局库 {selectedLibrarySpecItemIds.length}/{libraryItems.length || 0}
                </Tag>
                {customSpecGroupCount > 0 ? <Tag color="purple">自定义 {customSpecGroupCount} 组</Tag> : null}
              </Space>
            </div>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
              三类来源可叠加：先勾选分类模板与全局项，再补充本菜品专用规格；保存时自动去重。
            </Typography.Paragraph>
            <div className="menu-edit-spec-scroll">
              <Collapse
                bordered
                className="menu-edit-spec-collapse"
                defaultActiveKey={['category', 'library', 'custom']}
                items={[
                  {
                    key: 'category',
                    label: (
                      <Space wrap size={8}>
                        <span>引用分类规格模板</span>
                        <Badge count={selectedCategorySpecIds.length} color="#1677ff" overflowCount={999} showZero />
                        {categorySpecs.length > 0 ? (
                          <Typography.Text type="secondary">共 {categorySpecs.length} 个可选项</Typography.Text>
                        ) : null}
                      </Space>
                    ),
                    extra:
                      selectedCategoryId && categorySpecs.length > 0 ? (
                        <Space size={4} onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="small"
                            onClick={() => setSelectedCategorySpecIds(allCategorySpecIds)}
                            disabled={!canEditMenu}
                          >
                            全选
                          </Button>
                          <Button
                            size="small"
                            type="text"
                            onClick={() => setSelectedCategorySpecIds([])}
                            disabled={!canEditMenu || selectedCategorySpecIds.length === 0}
                          >
                            清空
                          </Button>
                        </Space>
                      ) : null,
                    children: !selectedCategoryId ? (
                      <Typography.Text type="secondary">请先选择所属分类。</Typography.Text>
                    ) : categorySpecs.length === 0 ? (
                      <Space direction="vertical" size={8}>
                        <Typography.Text type="secondary">
                          该分类下还没有规格模板，请先到「分类规格模板」页维护。
                        </Typography.Text>
                        <Button type="link" style={{ paddingInline: 0 }} onClick={() => onOpenCategorySpecs?.(selectedCategoryId)}>
                          前往分类规格模板 →
                        </Button>
                      </Space>
                    ) : (
                      <div className="manage-spec-group-list">
                        {categorySpecsByType.map((group) => {
                          const groupIds = group.items.map((item) => item.id)
                          const currentValues = selectedCategorySpecIds.filter((id) => groupIds.includes(id))
                          return (
                            <div key={group.specType} className="manage-spec-group-block">
                              <div className="manage-spec-group-header">
                                <div className="manage-spec-group-title-block">
                                  <Typography.Title level={5} style={{ margin: 0 }}>
                                    {group.specType}
                                  </Typography.Title>
                                  <Typography.Text type="secondary">顾客可选的规格项（加价以分类模板为准）</Typography.Text>
                                </div>
                                <Tag color="blue">{group.items.length} 项</Tag>
                              </div>
                              <Checkbox.Group
                                value={currentValues}
                                onChange={(checkedValues) => {
                                  const nextValues = selectedCategorySpecIds
                                    .filter((id) => !groupIds.includes(id))
                                    .concat((checkedValues as string[]) ?? [])
                                  setSelectedCategorySpecIds(nextValues)
                                }}
                              >
                                <div className="manage-spec-checkbox-grid">
                                  {group.items.map((item) => (
                                    <Checkbox key={item.id} value={item.id} className="manage-spec-checkbox">
                                      <div className="manage-spec-checkbox-label">
                                        <span className="manage-spec-checkbox-name">{item.spec_value}</span>
                                        <Tag className="manage-spec-checkbox-tag" color={item.price_delta ? 'red' : 'default'}>
                                          +¥{Number(item.price_delta || 0).toFixed(2)}
                                        </Tag>
                                      </div>
                                    </Checkbox>
                                  ))}
                                </div>
                              </Checkbox.Group>
                            </div>
                          )
                        })}
                      </div>
                    ),
                  },
                  {
                    key: 'library',
                    label: (
                      <Space wrap size={8}>
                        <span>引用全局规格库</span>
                        <Badge count={selectedLibrarySpecItemIds.length} color="#13c2c2" overflowCount={999} showZero />
                        {libraryItems.length > 0 ? (
                          <Typography.Text type="secondary">共 {libraryItems.length} 个规格项</Typography.Text>
                        ) : null}
                      </Space>
                    ),
                    extra:
                      librarySpecsByType.length > 0 ? (
                        <Space size={4} onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="small"
                            onClick={() => setSelectedLibrarySpecItemIds(allLibrarySpecItemIds)}
                            disabled={!canEditMenu}
                          >
                            全选
                          </Button>
                          <Button
                            size="small"
                            type="text"
                            onClick={() => setSelectedLibrarySpecItemIds([])}
                            disabled={!canEditMenu || selectedLibrarySpecItemIds.length === 0}
                          >
                            清空
                          </Button>
                        </Space>
                      ) : null,
                    children:
                      librarySpecsByType.length === 0 ? (
                        <Typography.Text type="secondary">
                          基础规格库暂无可选项，请到顶部「基础规格库」页维护规格组与规格项。
                        </Typography.Text>
                      ) : (
                        <div className="manage-spec-group-list">
                          {librarySpecsByType.map((group) => {
                            const groupIds = group.items.map((item) => item.id)
                            const currentValues = selectedLibrarySpecItemIds.filter((id) => groupIds.includes(id))
                            return (
                              <div key={group.specType} className="manage-spec-group-block">
                                <div className="manage-spec-group-header">
                                  <div className="manage-spec-group-title-block">
                                    <Typography.Title level={5} style={{ margin: 0 }}>
                                      {group.specType}
                                    </Typography.Title>
                                    <Typography.Text type="secondary">来自基础规格库，保存后写入本菜品</Typography.Text>
                                  </div>
                                  <Tag color="cyan">{group.items.length} 项</Tag>
                                </div>
                                <Checkbox.Group
                                  value={currentValues}
                                  onChange={(checkedValues) => {
                                    const nextValues = selectedLibrarySpecItemIds
                                      .filter((id) => !groupIds.includes(id))
                                      .concat((checkedValues as string[]) ?? [])
                                    setSelectedLibrarySpecItemIds(nextValues)
                                  }}
                                >
                                  <div className="manage-spec-checkbox-grid">
                                    {group.items.map((item) => (
                                      <Checkbox key={item.id} value={item.id} className="manage-spec-checkbox">
                                        <div className="manage-spec-checkbox-label">
                                          <span className="manage-spec-checkbox-name">{item.name}</span>
                                          <Tag className="manage-spec-checkbox-tag" color={item.default_price ? 'red' : 'default'}>
                                            +¥{Number(item.default_price || 0).toFixed(2)}
                                          </Tag>
                                        </div>
                                      </Checkbox>
                                    ))}
                                  </div>
                                </Checkbox.Group>
                              </div>
                            )
                          })}
                        </div>
                      ),
                  },
                  {
                    key: 'custom',
                    label: (
                      <Space wrap size={8}>
                        <span>本菜品自定义规格</span>
                        {customSpecGroupCount > 0 ? (
                          <Typography.Text type="secondary">{customSpecGroupCount} 组</Typography.Text>
                        ) : (
                          <Typography.Text type="secondary">可选</Typography.Text>
                        )}
                      </Space>
                    ),
                    children: (
                      <>
                        <Typography.Paragraph type="secondary" className="modal-note" style={{ marginBottom: 12 }}>
                          新增的规格组会同步写入基础规格库。若与全局项重复，保存时会自动去重。
                        </Typography.Paragraph>
                        <Form.List name="custom_spec_groups">
                          {(groupFields, { add: addGroup, remove: removeGroup }) => (
                            <div className="inline-editor-list menu-custom-spec-groups">
                              {groupFields.map(({ key, name, ...rest }) => (
                                <div key={key} className="manage-spec-group-block menu-custom-spec-group-card">
                                  <div className="menu-custom-spec-group-head">
                                    <Form.Item
                                      {...rest}
                                      name={[name, 'spec_type']}
                                      label="规格组名称"
                                      rules={[{ required: true, message: '请输入规格组名称' }]}
                                      className="menu-custom-spec-type-item"
                                    >
                                      <Input placeholder="如：做法、甜度、加料" />
                                    </Form.Item>
                                    <Button type="text" danger onClick={() => removeGroup(name)} disabled={!canEditMenu}>
                                      删除组
                                    </Button>
                                  </div>
                                  <Form.List name={[name, 'items']}>
                                    {(itemFields, { add: addItem, remove: removeItem }) => (
                                      <div className="inline-editor-list menu-custom-spec-items">
                                        {itemFields.map(({ key: itemKey, name: itemName, ...itemRest }) => (
                                          <div key={itemKey} className="inline-editor-row menu-custom-spec-item-row">
                                            <Form.Item
                                              {...itemRest}
                                              name={[itemName, 'spec_value']}
                                              label="规格项"
                                              rules={[{ required: true, message: '请输入规格项' }]}
                                            >
                                              <Input placeholder="如：少冰、加蛋" />
                                            </Form.Item>
                                            <Form.Item {...itemRest} name={[itemName, 'price_delta']} label="加价（元）">
                                              <Input type="number" step={0.01} min={0} placeholder="0.00" />
                                            </Form.Item>
                                            <Button type="text" danger onClick={() => removeItem(itemName)} disabled={!canEditMenu}>
                                              删除
                                            </Button>
                                          </div>
                                        ))}
                                        <Button
                                          type="dashed"
                                          onClick={() => addItem({ spec_value: '', price_delta: 0 })}
                                          block
                                          disabled={!canEditMenu}
                                        >
                                          + 添加规格项
                                        </Button>
                                      </div>
                                    )}
                                  </Form.List>
                                </div>
                              ))}
                              <Button
                                type="dashed"
                                onClick={() => addGroup({ spec_type: '', items: [{ spec_value: '', price_delta: 0 }] })}
                                block
                                disabled={!canEditMenu}
                              >
                                + 添加自定义规格组
                              </Button>
                            </div>
                          )}
                        </Form.List>
                      </>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </Form>
      </Modal>
    </>
  )
}

export default function MenuManage() {
  const [workspaceTab, setWorkspaceTab] = useState('business')
  const [businessTab, setBusinessTab] = useState('menu')
  const [preferredCategoryId, setPreferredCategoryId] = useState<string | undefined>()

  const openCategorySpecs = (categoryId?: string) => {
    setPreferredCategoryId(categoryId)
    setWorkspaceTab('business')
    setBusinessTab('category-spec')
  }

  return (
    <div className="manage-shell menu-manage-shell">
      <Card className="manage-panel-card menu-manage-tab-shell">
        <Tabs
          className="manage-tabs"
          activeKey={workspaceTab}
          onChange={setWorkspaceTab}
          items={[
            {
              key: 'business',
              label: '菜单',
              children: (
                <Tabs
                  className="manage-tabs nested-manage-tabs"
                  activeKey={businessTab}
                  onChange={setBusinessTab}
                  items={[
                    {
                      key: 'menu',
                      label: '菜单工作台',
                      children: <MenuListTab onOpenCategorySpecs={openCategorySpecs} />,
                    },
                    {
                      key: 'category-spec',
                      label: '分类规格模板',
                      children: <CategorySpecTab preferredCategoryId={preferredCategoryId} />,
                    },
                  ]}
                />
              ),
            },
            {
              key: 'library',
              label: '基础规格库',
              children: <SpecGroupTab />,
            },
          ]}
        />
      </Card>
    </div>
  )
}
