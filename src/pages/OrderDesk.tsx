import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Button, Card, Empty, Form, InputNumber, Popconfirm, Popover, Radio, Space, Statistic, Tabs, Tag, Typography, message } from 'antd'
import { PlusOutlined, MinusOutlined, AudioOutlined, SoundOutlined } from '@ant-design/icons'
import type { Menu, MenuCategory, MenuSpec, Table as TableType } from '../api/types'
import { listMenuCategories, listMenus } from '../api/menu'
import { listTables } from '../api/table'
import { createOrder } from '../api/order'
import { useSTT } from '../hooks/useSTT'
import { useTTS } from '../hooks/useTTS'
import { matchMenuByText, parseOrderItems } from '../utils/menuMatcher'
import { useOrderCart } from '../contexts/OrderCartContext'
import { useAuth } from '../contexts/AuthContext'

function defaultSpecs(specs: MenuSpec[]): MenuSpec[] {
  const byType = new Map<string, MenuSpec>()
  for (const s of specs) {
    const specType = s.spec_type ?? '默认规格'
    if (!byType.has(specType)) byType.set(specType, s)
  }
  return Array.from(byType.values())
}

const ORDER_TYPE_OPTIONS = [
  { label: '堂食', value: 'dine_in' },
  { label: '打包外带', value: 'takeaway' },
]

export default function OrderDesk() {
  const { can } = useAuth()
  const canCreateFromDesk = can('order_desk:create')
  const { cart, setCart, updateCartQty, cartTotal, clearCart } = useOrderCart()
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [tables, setTables] = useState<TableType[]>([])
  const [tablesLoading, setTablesLoading] = useState(false)
  const [orderType, setOrderType] = useState<string>('dine_in')
  const [tableId, setTableId] = useState<string | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)
  const [cardSelections, setCardSelections] = useState<Record<string, { quantity: number; selectedSpecs: MenuSpec[] }>>({})

  const { isSupported: sttSupported, listening, transcript, finalTranscript, start: startSTT, stop: stopSTT } = useSTT({
    lang: 'zh-CN',
    continuous: true,
    interimResults: true,
  })
  const { speak, isSupported: ttsSupported } = useTTS({ lang: 'zh-CN', rate: 1.2 })

  const loadCategories = useCallback(async () => {
    try {
      const res = await listMenuCategories({ current: 1, pageSize: 100 })
      setCategories(Array.isArray(res?.categories) ? res.categories : [])
    } catch {
      message.error('加载分类失败')
      setCategories([])
    }
  }, [])

  const loadMenus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listMenus({
        current: 1,
        pageSize: 500,
        category: activeCategory === 'all' ? undefined : activeCategory,
      })
      setMenus(Array.isArray(res?.menus) ? res.menus : [])
    } catch {
      message.error('加载菜品失败')
      setMenus([])
    } finally {
      setLoading(false)
    }
  }, [activeCategory])

  const loadTables = useCallback(async () => {
    setTablesLoading(true)
    try {
      const res = await listTables({ current: 1, pageSize: 500 })
      setTables(Array.isArray(res?.tables) ? res.tables : [])
    } catch {
      message.error('加载桌号列表失败')
      setTables([])
    } finally {
      setTablesLoading(false)
    }
  }, [])

  const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart])
  const selectedTable = useMemo(() => tables.find((item) => item.id === tableId), [tableId, tables])

  useEffect(() => {
    loadCategories()
    loadTables()
  }, [loadCategories, loadTables])

  useEffect(() => {
    loadMenus()
  }, [loadMenus])

  useEffect(() => {
    if (orderType === 'dine_in') {
      loadTables()
    }
  }, [orderType, loadTables])

  const getSelection = useCallback(
    (menu: Menu) => {
      const raw = cardSelections[menu.id]
      const defaults = menu.specs?.length ? defaultSpecs(menu.specs) : []
      const byType = new Map(defaults.map((s) => [s.spec_type, s]))
      raw?.selectedSpecs?.forEach((s) => byType.set(s.spec_type, s))
      const selectedSpecs = Array.from(byType.values())
      const quantity = raw?.quantity ?? 1
      return { quantity, selectedSpecs }
    },
    [cardSelections]
  )

  const setMenuQuantity = (menu: Menu, quantity: number) => {
    setCardSelections((prev) => ({
      ...prev,
      [menu.id]: {
        quantity: Math.max(1, Math.min(99, quantity)),
        selectedSpecs: prev[menu.id]?.selectedSpecs ?? (menu.specs?.length ? defaultSpecs(menu.specs) : []),
      },
    }))
  }

  const setMenuSpec = (menu: Menu, specType: string, spec: MenuSpec) => {
    const current = getSelection(menu).selectedSpecs.filter((s) => s.spec_type !== specType)
    setCardSelections((prev) => ({
      ...prev,
      [menu.id]: {
        quantity: prev[menu.id]?.quantity ?? 1,
        selectedSpecs: [...current, spec],
      },
    }))
  }

  const addToCart = (menu: Menu, customQuantity?: number) => {
    const { quantity, selectedSpecs } = getSelection(menu)
    const finalQuantity = customQuantity ?? quantity
    const specInfo = selectedSpecs.length ? selectedSpecs.map((s) => `${s.spec_type}:${s.spec_value}`).join(' ') : undefined
    const unitPrice = menu.price + selectedSpecs.reduce((sum, s) => sum + (s.price_delta ?? 0), 0)
    const price = Math.round(unitPrice * 100) / 100

    setCart((prev) => {
      const exist = prev.find((i) => i.menuId === menu.id && (i.specInfo ?? '') === (specInfo ?? ''))
      if (exist) {
        return prev.map((i) =>
          i.menuId === menu.id && (i.specInfo ?? '') === (specInfo ?? '') ? { ...i, quantity: i.quantity + finalQuantity } : i
        )
      }
      return [...prev, { menuId: menu.id, name: menu.name, price, quantity: finalQuantity, specInfo, image: menu.image }]
    })

    if (ttsSupported) {
      speak(`已添加${finalQuantity}份${menu.name}，价格${price}元`)
    }
  }

  const inferMenusByMention = useCallback(
    (text: string) => {
      const normalized = text.toLowerCase().replace(/\s+/g, '').replace(/[，,。.!！？?；;、]/g, '')
      if (!normalized) return [] as Menu[]
      return [...menus]
        .sort((a, b) => b.name.length - a.name.length)
        .filter((menu) => normalized.includes(menu.name.toLowerCase().replace(/\s+/g, '')))
    },
    [menus]
  )

  const processedSpeechTextRef = useRef<Set<string>>(new Set())
  const processSpeechText = useCallback(
    (speechText: string) => {
      const text = speechText.trim()
      if (!text || menus.length === 0) return
      if (processedSpeechTextRef.current.has(text)) return
      processedSpeechTextRef.current.add(text)

      const successItems: Array<{ menu: Menu; quantity: number }> = []
      const failedNames: string[] = []
      const pickedMenuIds = new Set<string>()
      const parsedItems = parseOrderItems(text)

      parsedItems.forEach((item) => {
        const matchedMenus = matchMenuByText(item.menuName, menus)
        if (matchedMenus.length > 0) {
          const matchedMenu = matchedMenus[0]
          if (pickedMenuIds.has(matchedMenu.id)) return
          pickedMenuIds.add(matchedMenu.id)
          successItems.push({ menu: matchedMenu, quantity: item.quantity })
        } else {
          failedNames.push(item.menuName)
        }
      })

      // 智能兜底：即使语义解析失败，也尽量从整句中提取到被提及的菜名，默认加 1 份。
      if (successItems.length === 0) {
        const mentionedMenus = inferMenusByMention(text)
        mentionedMenus.forEach((menu) => {
          if (pickedMenuIds.has(menu.id)) return
          pickedMenuIds.add(menu.id)
          successItems.push({ menu, quantity: 1 })
        })
      }

      if (successItems.length > 0) {
        setCart((prev) => {
          const next = [...prev]
          successItems.forEach(({ menu, quantity }) => {
            const { selectedSpecs } = getSelection(menu)
            const specInfo = selectedSpecs.length ? selectedSpecs.map((s) => `${s.spec_type}:${s.spec_value}`).join(' ') : undefined
            const unitPrice = menu.price + selectedSpecs.reduce((sum, s) => sum + (s.price_delta ?? 0), 0)
            const price = Math.round(unitPrice * 100) / 100
            const existIndex = next.findIndex((i) => i.menuId === menu.id && (i.specInfo ?? '') === (specInfo ?? ''))
            if (existIndex >= 0) {
              const current = next[existIndex]
              next[existIndex] = { ...current, quantity: current.quantity + quantity }
            } else {
              next.push({ menuId: menu.id, name: menu.name, price, quantity, specInfo, image: menu.image })
            }
          })
          return next
        })

        const successText = successItems.map((item) => `${item.menu.name} x${item.quantity}`).join('、')
        message.success(`已添加：${successText}`)
        if (ttsSupported) {
          speak(`已添加${successText}`)
        }
      }

      if (failedNames.length > 0) {
        const failedText = failedNames.join('、')
        message.warning(`未找到菜品：${failedText}`)
      } else if (successItems.length === 0) {
        message.warning('未识别到明确菜品，请再说一遍')
      }
    },
    [menus, inferMenusByMention, getSelection, setCart, ttsSupported, speak]
  )

  useEffect(() => {
    if (finalTranscript) {
      processSpeechText(finalTranscript)
    }
  }, [finalTranscript, processSpeechText])

  useEffect(() => {
    if (!listening && transcript && !finalTranscript) {
      processSpeechText(transcript)
    }
  }, [listening, transcript, finalTranscript, processSpeechText])

  const speakMenuInfo = (menu: Menu) => {
    if (!ttsSupported) return
    const { selectedSpecs } = getSelection(menu)
    const unitPrice = menu.price + selectedSpecs.reduce((sum, s) => sum + (s.price_delta ?? 0), 0)
    const specText = selectedSpecs.length > 0 ? `，规格${selectedSpecs.map((s) => s.spec_value).join('、')}` : ''
    speak(`${menu.name}，价格${unitPrice.toFixed(2)}元${specText}`)
  }

  const handleSubmit = async () => {
    if (!canCreateFromDesk) {
      message.warning('当前账号没有点餐台下单权限')
      return
    }
    if (cart.length === 0) {
      message.warning('请先添加菜品')
      return
    }
    if (orderType === 'dine_in' && !tableId) {
      message.warning('堂食订单请选择桌号')
      return
    }

    setSubmitting(true)
    try {
      await createOrder({
        order_type: orderType,
        table_id: orderType === 'dine_in' ? tableId : undefined,
        items: cart.map((i) => ({
          menu_name: i.name,
          quantity: i.quantity,
          unit_price: i.price,
          spec_info: i.specInfo || undefined,
        })),
        total_amount: Math.round(cartTotal * 100) / 100,
      })
      message.success('下单成功')
      clearCart()
    } catch {
      message.error('下单失败')
    } finally {
      setSubmitting(false)
    }
  }

  const tabItems = [{ key: 'all', label: '全部' }, ...categories.map((c) => ({ key: c.name, label: c.name }))]

  return (
    <div className="order-desk-layout">
      <div className="order-desk-main">
        <div className="page-toolbar page-toolbar-actions-only">
          {sttSupported && (
            <Space>
              {listening ? (
                <Popover content={`正在识别：${transcript || '请说话...'}`} trigger="click">
                  <Button type="primary" danger icon={<AudioOutlined />} onClick={stopSTT}>
                    停止识别
                  </Button>
                </Popover>
              ) : (
                <Popover
                  content={
                    <div>
                      <p>点击开始语音点菜</p>
                      <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                        可以说："来两份宫保鸡丁和一份鱼香肉丝，再要一个可乐"
                      </p>
                    </div>
                  }
                  trigger="hover"
                >
                  <Button className="app-accent-cta-subtle" type="default" icon={<AudioOutlined />} onClick={startSTT}>
                    语音点餐
                  </Button>
                </Popover>
              )}
            </Space>
          )}
        </div>

        <Card className="order-desk-filter-card">
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Space wrap size={[8, 8]}>
              <Tag color="blue">分类 {categories.length}</Tag>
              <Tag color="purple">菜品 {menus.length}</Tag>
              <Tag color="gold">已选 {cartItemCount}</Tag>
            </Space>
            <Tabs className="order-desk-tabs" activeKey={activeCategory} onChange={setActiveCategory} items={tabItems} />
          </Space>
        </Card>

        {menus.length === 0 && !loading ? (
          <Card className="order-desk-filter-card" style={{ marginTop: 18 }}>
            <Empty description="暂无菜品" />
          </Card>
        ) : (
          <div className="order-desk-grid">
            {menus.map((menu) => {
              const { quantity, selectedSpecs } = getSelection(menu)
              const unitPrice = menu.price + selectedSpecs.reduce((sum, s) => sum + (s.price_delta ?? 0), 0)
              const specsByType = new Map<string, MenuSpec[]>()
              for (const s of menu.specs ?? []) {
                const specType = s.spec_type ?? '默认规格'
                if (!specsByType.has(specType)) specsByType.set(specType, [])
                specsByType.get(specType)!.push(s)
              }

              return (
                <Card
                  key={menu.id}
                  hoverable
                  loading={loading}
                  className="order-desk-menu-card"
                  cover={
                    <div className="order-desk-menu-cover">
                      {menu.image ? (
                        <img
                          alt={menu.name}
                          src={menu.image}
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="order-desk-menu-empty-cover">暂无图片</div>
                      )}
                    </div>
                  }
                >
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <div className="order-desk-menu-topline">
                      <div style={{ minWidth: 0 }}>
                        <Typography.Title level={5} style={{ margin: 0 }}>
                          {menu.name}
                        </Typography.Title>
                        {menu.description ? (
                          <Typography.Paragraph type="secondary" ellipsis={{ rows: 2, tooltip: menu.description }} style={{ margin: '4px 0 0' }}>
                            {menu.description}
                          </Typography.Paragraph>
                        ) : null}
                      </div>
                      <Space size={4}>
                        {ttsSupported && <Button type="text" size="small" icon={<SoundOutlined />} onClick={() => speakMenuInfo(menu)} />}
                        <Tag color="red" style={{ marginInlineEnd: 0 }}>
                          ¥{unitPrice.toFixed(2)}
                        </Tag>
                      </Space>
                    </div>

                    <div className="order-desk-qty-box">
                      <Typography.Text type="secondary">选择数量</Typography.Text>
                      <Space size={4}>
                        <Button
                          type="text"
                          size="small"
                          icon={<MinusOutlined />}
                          onClick={() => setMenuQuantity(menu, Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                        />
                        <InputNumber
                          className="order-desk-qty-input"
                          min={1}
                          max={99}
                          controls={false}
                          size="small"
                          value={quantity}
                          onChange={(value) => setMenuQuantity(menu, Number(value) || 1)}
                        />
                        <Button
                          type="text"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => setMenuQuantity(menu, Math.min(99, quantity + 1))}
                          disabled={quantity >= 99}
                        />
                      </Space>
                    </div>

                    {specsByType.size > 0 &&
                      Array.from(specsByType.entries()).map(([type, opts]) => {
                        const current = selectedSpecs.find((s) => s.spec_type === type)
                        return (
                          <div key={type} className="order-desk-spec-block">
                            <Typography.Text type="secondary" className="order-desk-spec-label">
                              {type}
                            </Typography.Text>
                            <Radio.Group
                              className="order-desk-spec-group"
                              value={current?.spec_value}
                              onChange={(e) => {
                                const spec = opts.find((o) => o.spec_value === e.target.value)
                                if (spec) setMenuSpec(menu, type, spec)
                              }}
                              optionType="button"
                              size="small"
                              options={opts.map((o) => ({
                                label: `${o.spec_value ?? '默认'}${o.price_delta ? ` +¥${o.price_delta}` : ''}`,
                                value: o.spec_value ?? '默认',
                              }))}
                            />
                          </div>
                        )
                      })}

                    <Button type="primary" block icon={<PlusOutlined />} onClick={() => addToCart(menu)}>
                      加入购物车
                    </Button>
                  </Space>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <div className="order-desk-summary-pane">
        <Card className="order-desk-summary-card">
          <Space direction="vertical" size={18} style={{ width: '100%' }}>
            <div className="page-toolbar" style={{ marginBottom: 0 }}>
              <div>
                <Typography.Title level={5} style={{ margin: 0 }}>
                  订单结算
                </Typography.Title>
                <Typography.Text type="secondary">
                  {orderType === 'dine_in' ? (selectedTable ? `当前桌台：${selectedTable.code}` : '请选择堂食桌台') : '当前为打包外带'}
                </Typography.Text>
              </div>
              <Button type="link" danger style={{ padding: 0 }} onClick={clearCart} disabled={cart.length === 0}>
                清空
              </Button>
            </div>

            <Space size="large" wrap>
              <Statistic title="菜品数量" value={cartItemCount} suffix="份" />
              <Statistic title="订单金额" value={cartTotal} precision={2} prefix="¥" />
            </Space>

            <Form layout="vertical">
              <Form.Item label="就餐方式" style={{ marginBottom: 12 }}>
                <Radio.Group value={orderType} onChange={(e) => setOrderType(e.target.value)} optionType="button" options={ORDER_TYPE_OPTIONS} />
              </Form.Item>
              {orderType === 'dine_in' && (
                <Form.Item label={`桌号${tablesLoading ? '（加载中）' : tables.length ? `（共 ${tables.length} 桌）` : ''}`} style={{ marginBottom: 0 }}>
                  {tables.length === 0 && !tablesLoading ? (
                    <Alert type="warning" showIcon message="暂无餐桌，请先在餐桌管理中添加" />
                  ) : (
                    <Radio.Group
                      value={tableId}
                      onChange={(e) => setTableId(e.target.value)}
                      optionType="button"
                      style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
                      options={tables.map((t) => ({ label: `${t.code}（${t.capacity}人）`, value: t.id }))}
                    />
                  )}
                </Form.Item>
              )}
            </Form>

            <Popconfirm
              title="确认提交订单？"
              description="提交后将进入订单流程，可在订单管理中继续跟进状态。"
              okText="确认提交"
              cancelText="取消"
              onConfirm={handleSubmit}
              disabled={cart.length === 0 || submitting || !canCreateFromDesk}
              okButtonProps={{ loading: submitting }}
            >
              <Button
                className="app-accent-cta"
                type="primary"
                size="large"
                block
                loading={submitting}
                disabled={cart.length === 0 || !canCreateFromDesk}
              >
                提交订单
              </Button>
            </Popconfirm>
          </Space>
        </Card>

      </div>

      <div className="order-desk-cart-pane">
        <Card className="order-desk-cart-card">
          <Space direction="vertical" size={14} style={{ width: '100%' }}>
            <div className="page-toolbar" style={{ marginBottom: 0 }}>
              <div>
                <Typography.Title level={5} style={{ margin: 0 }}>
                  购物车
                </Typography.Title>
                <Typography.Text type="secondary">
                  已选择 {cart.length} 种菜品，共 {cartItemCount} 份
                </Typography.Text>
              </div>
            </div>

            {cart.length === 0 ? (
              <Empty description="先从左侧选择菜品加入购物车" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div className="order-desk-cart-list">
                {cart.map((item, idx) => (
                  <div key={`${item.menuId}-${item.specInfo ?? ''}-${idx}`} className="order-desk-cart-item">
                    <div className="order-desk-cart-thumb">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="order-desk-cart-thumb-empty">无图</div>
                      )}
                    </div>
                    <div className="order-desk-cart-meta">
                      <Typography.Text strong className="order-desk-cart-name">
                        {item.name}
                      </Typography.Text>
                      <Typography.Text type="secondary" className="order-desk-cart-subline">
                        {item.specInfo ? `${item.specInfo} · ` : ''}
                        <span className="order-desk-cart-price">¥{item.price.toFixed(2)}</span>
                      </Typography.Text>
                    </div>
                    <Space size={2} className="order-desk-cart-actions">
                      <Button type="text" size="small" icon={<MinusOutlined />} onClick={() => updateCartQty(item.menuId, item.specInfo, -1)} />
                      <strong className="order-desk-cart-qty">{item.quantity}</strong>
                      <Button type="text" size="small" icon={<PlusOutlined />} onClick={() => updateCartQty(item.menuId, item.specInfo, 1)} />
                    </Space>
                  </div>
                ))}
              </div>
            )}
          </Space>
        </Card>
      </div>
    </div>
  )
}
