import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  Card,
  Drawer,
  Empty,
  Segmented,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  AppstoreOutlined,
  DragOutlined,
  EyeOutlined,
  ReloadOutlined,
  ShoppingOutlined,
} from '@ant-design/icons'
import { listOrders } from '../api/order'
import { listTables } from '../api/table'
import type { Order, Table } from '../api/types'
import { useAuth } from '../contexts/AuthContext'
import {
  buildDefaultLayoutForTables,
  mergePositionsWithTables,
  saveFloorLayout,
  type FloorPosition,
} from '../utils/tableFloorLayout'
import { isActiveOrderStatus, normOrderStatus, orderStatusLabel } from '../utils/orderStatus'

function tableStatusLabel(status: string) {
  if (status === 'using') return '使用中'
  if (status === 'idle' || status === 'free') return '空闲'
  return status || '未知'
}

function ordersForTable(orders: Order[], tableId: string) {
  return orders.filter((o) => o.table_id === tableId && isActiveOrderStatus(o.status))
}

function strongestOrderStatus(orders: Order[]): string | null {
  if (!orders.length) return null
  if (orders.some((o) => normOrderStatus(o.status) === 'preparing')) return 'preparing'
  if (orders.some((o) => normOrderStatus(o.status) === 'paid')) return 'paid'
  if (orders.some((o) => normOrderStatus(o.status) === 'created')) return 'created'
  return normOrderStatus(orders[0]?.status) || null
}

export default function TableFloorMap() {
  const { can } = useAuth()
  const canEditLayout = can('table:edit')

  const floorRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const dragMovedRef = useRef(false)
  const [loading, setLoading] = useState(true)
  const [tables, setTables] = useState<Table[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [positions, setPositions] = useState<Record<string, FloorPosition>>({})
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [drawerTable, setDrawerTable] = useState<Table | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [tableRes, orderRes] = await Promise.all([
        listTables({ current: 1, pageSize: 500 }),
        listOrders({ current: 1, pageSize: 500 }),
      ])
      const list = Array.isArray(tableRes?.tables) ? tableRes.tables : []
      const ords = Array.isArray(orderRes?.orders) ? orderRes.orders : []
      setTables(list)
      setOrders(ords.filter((o) => o.table_id != null && isActiveOrderStatus(o.status)))
    } catch {
      message.error('加载餐桌或订单失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!canEditLayout && mode === 'edit') setMode('view')
  }, [canEditLayout, mode])

  useEffect(() => {
    const t = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void loadData()
    }, 45000)
    return () => window.clearInterval(t)
  }, [loadData])

  useEffect(() => {
    if (!tables.length) return
    setPositions((prev) => mergePositionsWithTables(tables, prev))
  }, [tables])

  const persistLayout = useCallback(
    (next: Record<string, FloorPosition>) => {
      const ids = new Set(tables.map((t) => String(t.id)))
      const serializable: Record<string, FloorPosition> = {}
      for (const [k, v] of Object.entries(next)) {
        if (ids.has(String(k))) serializable[String(k)] = v
      }
      saveFloorLayout(serializable, ids)
    },
    [tables]
  )

  const clientToPercent = useCallback((clientX: number, clientY: number): FloorPosition | null => {
    const el = floorRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1) return null
    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100
    return { x: Math.min(96, Math.max(4, x)), y: Math.min(96, Math.max(4, y)) }
  }, [])

  useEffect(() => {
    if (draggingId == null) return
    const onMove = (e: PointerEvent) => {
      const start = dragStartRef.current
      if (start) {
        const d = Math.hypot(e.clientX - start.x, e.clientY - start.y)
        if (d > 6) dragMovedRef.current = true
      }
      const p = clientToPercent(e.clientX, e.clientY)
      if (!p) return
      setPositions((prev) => ({ ...prev, [String(draggingId)]: p }))
    }
    const onUp = () => {
      setDraggingId(null)
      dragStartRef.current = null
      setPositions((prev) => {
        persistLayout(prev)
        return prev
      })
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [draggingId, clientToPercent, persistLayout])

  const handleResetLayout = () => {
    const next = buildDefaultLayoutForTables(tables)
    setPositions(next)
    persistLayout(next)
    message.success('已恢复默认排布')
  }

  const tableDrawerOrders = useMemo(() => {
    if (!drawerTable) return []
    return ordersForTable(orders, drawerTable.id)
  }, [drawerTable, orders])

  const editMode = mode === 'edit' && canEditLayout

  return (
    <div className="floor-map-page">
      <Card className="floor-map-hero manage-hero-card" loading={loading}>
        <div className="floor-map-hero-inner">
          <div>
            <Typography.Title level={4} className="floor-map-title">
              餐桌平面图
            </Typography.Title>
            <Typography.Paragraph type="secondary" className="floor-map-lead">
              在编辑模式下拖拽圆台对齐真实厅面；有进行中订单的餐桌会高亮提示。布局保存在本浏览器，更换电脑需重新摆放。
            </Typography.Paragraph>
          </div>
          <Space wrap className="floor-map-toolbar">
            {canEditLayout ? (
              <Segmented
                value={mode}
                onChange={(v) => setMode(v as 'view' | 'edit')}
                options={[
                  { value: 'view', icon: <EyeOutlined />, label: '查看' },
                  { value: 'edit', icon: <DragOutlined />, label: '编辑布局' },
                ]}
              />
            ) : (
              <Tag icon={<EyeOutlined />} color="default">
                仅查看
              </Tag>
            )}
            <Button icon={<ReloadOutlined />} onClick={() => void loadData()}>
              刷新数据
            </Button>
            {canEditLayout ? (
              <Button danger type="default" onClick={handleResetLayout} disabled={!tables.length}>
                重置排布
              </Button>
            ) : null}
            <Link to="/tables">
              <Button icon={<AppstoreOutlined />}>餐桌列表</Button>
            </Link>
          </Space>
        </div>
        {!canEditLayout ? (
          <Typography.Text type="secondary" className="floor-map-hint">
            当前账号无「餐桌编辑」权限，仅可查看状态与高亮。
          </Typography.Text>
        ) : null}
      </Card>

      <Card className="floor-map-card manage-panel-card">
        {!tables.length && !loading ? (
          <Empty description="暂无餐桌数据，请先在餐桌管理中创建桌台" />
        ) : (
          <Spin spinning={loading}>
            <div
              ref={floorRef}
              className={`floor-map-canvas${editMode ? ' is-editing' : ''}`}
              aria-label="餐桌平面图"
            >
              {tables.map((table) => {
                const pos = positions[table.id] ?? { x: 50, y: 50 }
                const active = ordersForTable(orders, table.id)
                const ordStatus = strongestOrderStatus(active)
                const using = table.status === 'using'
                const nodeClass = [
                  'floor-map-node',
                  using ? 'is-using' : '',
                  ordStatus ? `has-order is-order-${ordStatus}` : '',
                  draggingId === table.id ? 'is-dragging' : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <button
                    key={table.id}
                    type="button"
                    className={nodeClass}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    onClick={() => {
                      if (editMode && dragMovedRef.current) {
                        dragMovedRef.current = false
                        return
                      }
                      dragMovedRef.current = false
                      setDrawerTable(table)
                    }}
                    onPointerDown={(e) => {
                      if (!editMode) return
                      e.preventDefault()
                      e.stopPropagation()
                      dragMovedRef.current = false
                      dragStartRef.current = { x: e.clientX, y: e.clientY }
                      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                      setDraggingId(table.id)
                    }}
                  >
                    <span className="floor-map-node-code">{table.code}</span>
                    {active.length > 0 ? <span className="floor-map-node-badge">{active.length}</span> : null}
                  </button>
                )
              })}
            </div>
          </Spin>
        )}

        <div className="floor-map-legend">
          <Typography.Text type="secondary">图例：</Typography.Text>
          <Tag>空闲</Tag>
          <Tag color="blue">使用中</Tag>
          <Tag color="gold">待支付订单</Tag>
          <Tag color="processing">已支付 / 制作中</Tag>
        </div>
      </Card>

      <Drawer
        title={drawerTable ? `桌位 ${drawerTable.code}` : ''}
        open={!!drawerTable}
        onClose={() => setDrawerTable(null)}
        width={360}
      >
        {drawerTable ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Typography.Text type="secondary">状态：</Typography.Text>{' '}
              <Tag color={drawerTable.status === 'using' ? 'blue' : 'default'}>
                {tableStatusLabel(drawerTable.status)}
              </Tag>
              <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                容量 {drawerTable.capacity} 人
              </Typography.Paragraph>
            </div>
            <Typography.Title level={5}>进行中订单</Typography.Title>
            {tableDrawerOrders.length === 0 ? (
              <Typography.Text type="secondary">当前无进行中的订单</Typography.Text>
            ) : (
              <ul className="floor-map-drawer-list">
                {tableDrawerOrders.map((o) => (
                  <li key={o.id}>
                    <Link to="/orders">
                      <Space>
                        <ShoppingOutlined />
                        <span>{o.order_no}</span>
                        <Tag>{orderStatusLabel(o.status)}</Tag>
                        <Typography.Text type="secondary">¥{Number(o.total_amount ?? 0).toFixed(2)}</Typography.Text>
                      </Space>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Space>
        ) : null}
      </Drawer>
    </div>
  )
}
