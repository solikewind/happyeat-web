import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Col, Row, Space, Statistic, Tooltip, Typography, message } from 'antd'
import {
  ArrowRightOutlined,
  BulbOutlined,
  DashboardOutlined,
  FundProjectionScreenOutlined,
  LayoutOutlined,
  MenuOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  TableOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { listMenus } from '../api/menu'
import { listOrders } from '../api/order'
import { listTables } from '../api/table'
import type { Order, Table } from '../api/types'
import type { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { PermissionKey } from '../auth/permissions'
import { appPath } from '../utils/appPath'
import { isActiveOrderStatus } from '../utils/orderStatus'

const HISTORY_DAYS = 14
const HISTORY_PAGE_SIZE = 200
const HISTORY_MAX_PAGES = 6

type EntryAccent = 'blue' | 'violet' | 'amber' | 'emerald' | 'slate'

interface QuickEntry {
  path: string
  title: string
  description: string
  icon: ReactNode
  accent: EntryAccent
  /** 与侧栏一致：新标签打开（如菜单大屏） */
  openInNewTab?: boolean
  /** 未配置则始终展示；配置后需具备对应权限 */
  permission?: PermissionKey
  ctaLabel?: string
}

interface EntryGroup {
  title: string
  hint: string
  entries: QuickEntry[]
}

const entryGroups: EntryGroup[] = [
  {
    title: '前厅点单',
    hint: '收银与接单主战场',
    entries: [
      {
        path: '/order-desk',
        title: '点餐台',
        description: '开台点单、规格备注与语音辅助，一单到底。',
        icon: <ShoppingCartOutlined />,
        accent: 'amber',
      },
      {
        path: '/orders',
        title: '订单管理',
        description: '检索、改状态、处理异常，订单全链路可视。',
        icon: <ShoppingOutlined />,
        accent: 'blue',
      },
    ],
  },
  {
    title: '后厨出餐',
    hint: '制作队列与出餐节奏',
    entries: [
      {
        path: '/workbench',
        title: '工作台',
        description: '已付与制作中单据集中处理，出餐完成一键回写。',
        icon: <DashboardOutlined />,
        accent: 'violet',
      },
    ],
  },
  {
    title: '门店配置',
    hint: '菜单与桌台基础资料',
    entries: [
      {
        path: '/menu',
        title: '菜单管理',
        description: '分类、菜品与规格维护，决定前台展示与价格。',
        icon: <MenuOutlined />,
        accent: 'emerald',
      },
      {
        path: '/menu-screen',
        title: '菜单大屏',
        description: '全屏展示菜品图与名称，适合电视或投影；不影响当前页。',
        icon: <FundProjectionScreenOutlined />,
        accent: 'violet',
        openInNewTab: true,
        permission: 'menu:view',
        ctaLabel: '新标签打开',
      },
      {
        path: '/tables',
        title: '餐桌管理',
        description: '分区、桌位与占用状态，支撑点餐与排桌。',
        icon: <TableOutlined />,
        accent: 'slate',
      },
      {
        path: '/table-map',
        title: '餐桌平面图',
        description: '自绘厅面布局，有订单的桌台实时高亮。',
        icon: <LayoutOutlined />,
        accent: 'blue',
      },
    ],
  },
]

interface DailyOrderPoint {
  key: string
  label: string
  value: number
}

const formatDayKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDayLabel = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}/${day}`
}

const createHistorySeed = () => {
  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  startDate.setDate(startDate.getDate() - (HISTORY_DAYS - 1))

  const points: DailyOrderPoint[] = []
  for (let index = 0; index < HISTORY_DAYS; index += 1) {
    const day = new Date(startDate)
    day.setDate(startDate.getDate() + index)
    points.push({
      key: formatDayKey(day),
      label: formatDayLabel(day),
      value: 0,
    })
  }

  return { points, startTs: Math.floor(startDate.getTime() / 1000) }
}

/** 订单 created_at（RFC3339）转 Unix 秒，与 createHistorySeed 的 startTs 对齐 */
function orderCreatedAtSeconds(order: Pick<Order, 'created_at'>): number {
  if (!order.created_at) return 0
  const t = new Date(order.created_at).getTime()
  return Number.isFinite(t) ? Math.floor(t / 1000) : 0
}

export default function Home() {
  const { can } = useAuth()
  const [loading, setLoading] = useState(false)
  const [menuTotal, setMenuTotal] = useState(0)
  const [tableTotal, setTableTotal] = useState(0)
  const [busyTableTotal, setBusyTableTotal] = useState(0)
  const [orderTotal, setOrderTotal] = useState(0)
  const [pendingOrderTotal, setPendingOrderTotal] = useState(0)
  const [orderHistory, setOrderHistory] = useState<DailyOrderPoint[]>([])

  useEffect(() => {
    const loadOverview = async () => {
      setLoading(true)
      try {
        const [menuRes, tableRes, orderRes] = await Promise.all([
          listMenus({ current: 1, pageSize: 500 }),
          listTables({ current: 1, pageSize: 500 }),
          listOrders({ current: 1, pageSize: HISTORY_PAGE_SIZE }),
        ])

        const tables = Array.isArray(tableRes?.tables) ? tableRes.tables : []
        const firstPageOrders = Array.isArray(orderRes?.orders) ? orderRes.orders : []
        const totalOrders = Number(orderRes?.total) || 0
        const { points, startTs } = createHistorySeed()
        const allHistoryOrders = [...firstPageOrders]

        if (allHistoryOrders.length < totalOrders) {
          for (let page = 2; page <= HISTORY_MAX_PAGES; page += 1) {
            const pageRes = await listOrders({ current: page, pageSize: HISTORY_PAGE_SIZE })
            const pageOrders = Array.isArray(pageRes?.orders) ? pageRes.orders : []
            if (!pageOrders.length) break

            allHistoryOrders.push(...pageOrders)
            const oldestTs = orderCreatedAtSeconds(pageOrders[pageOrders.length - 1])

            if (oldestTs > 0 && oldestTs < startTs) break
            if (allHistoryOrders.length >= totalOrders) break
          }
        }

        const historyMap = new Map(points.map((item) => [item.key, 0]))
        allHistoryOrders.forEach((item) => {
          const createAt = orderCreatedAtSeconds(item)
          if (!createAt || createAt < startTs) return
          const dayKey = formatDayKey(new Date(createAt * 1000))
          if (!historyMap.has(dayKey)) return
          historyMap.set(dayKey, (historyMap.get(dayKey) || 0) + 1)
        })

        setMenuTotal(Number(menuRes?.total) || 0)
        setTableTotal(Number(tableRes?.total) || 0)
        setBusyTableTotal(tables.filter((item: Table) => item.status === 'using').length)
        setOrderTotal(totalOrders)
        setPendingOrderTotal(firstPageOrders.filter((item: Order) => isActiveOrderStatus(item.status)).length)
        setOrderHistory(points.map((item) => ({ ...item, value: historyMap.get(item.key) || 0 })))
      } catch {
        message.error('概览数据加载失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    loadOverview()
  }, [])

  const statCards = useMemo(
    () =>
      [
        {
          key: 'on_sale_menu',
          title: '在售菜品',
          value: menuTotal,
          suffix: '道',
          hint: '含多规格条目',
          icon: <MenuOutlined />,
          accent: 'emerald' as const,
        },
        {
          key: 'table_total',
          title: '桌位总数',
          value: tableTotal,
          suffix: '桌',
          hint: '全店可编排桌位',
          icon: <TableOutlined />,
          accent: 'slate' as const,
        },
        {
          key: 'busy_tables',
          title: '用餐中',
          value: busyTableTotal,
          suffix: '桌',
          hint: '当前占用',
          icon: <ThunderboltOutlined />,
          accent: 'amber' as const,
        },
        {
          key: 'pending_orders',
          title: '待跟进单',
          value: pendingOrderTotal,
          suffix: '单',
          hint: '待支付 / 制作 / 出餐',
          icon: <ShoppingOutlined />,
          accent: 'blue' as const,
        },
      ] as const,
    [busyTableTotal, menuTotal, pendingOrderTotal, tableTotal]
  )

  const historyMax = useMemo(() => Math.max(1, ...orderHistory.map((item) => item.value)), [orderHistory])
  const historyTotal = useMemo(() => orderHistory.reduce((sum, item) => sum + item.value, 0), [orderHistory])

  return (
    <div className="home-page">
      <Card className="home-hero-card" loading={loading}>
        <div className="home-hero-grid">
          <div className="home-hero-main">
            <Typography.Text className="home-hero-kicker">今日概览</Typography.Text>
            <Typography.Title level={2} className="home-hero-title">
              经营全景一览
            </Typography.Title>
            <Typography.Paragraph className="home-hero-subtitle">
              数据与入口同屏：点单、出餐、菜单与桌台，一站衔接。
            </Typography.Paragraph>
            <Space wrap size="middle" className="home-hero-actions">
              <Link to="/order-desk">
                <Button className="app-accent-cta" type="primary" size="large" icon={<ShoppingCartOutlined />}>
                  打开点餐台
                </Button>
              </Link>
              <Link to="/workbench">
                <Button size="large" icon={<DashboardOutlined />}>
                  进入工作台
                </Button>
              </Link>
            </Space>
          </div>
          <div className="home-hero-aside">
            <div className="home-hero-metric home-hero-metric--primary">
              <div className="home-hero-metric-icon" aria-hidden>
                <ShoppingOutlined />
              </div>
              <div>
                <Typography.Text type="secondary" className="home-hero-metric-label">
                  累计订单（系统建档）
                </Typography.Text>
                <div className="home-hero-metric-value">{orderTotal}</div>
                <Typography.Text type="secondary" className="home-hero-metric-foot">
                  历史全量统计
                </Typography.Text>
              </div>
            </div>
            <div className="home-hero-metric home-hero-metric--accent">
              <div className="home-hero-metric-icon home-hero-metric-icon--pulse" aria-hidden>
                <ThunderboltOutlined />
              </div>
              <div>
                <Typography.Text type="secondary" className="home-hero-metric-label">
                  建议优先处理
                </Typography.Text>
                <Typography.Title level={5} className="home-hero-metric-title">
                  {pendingOrderTotal} 单待跟进
                </Typography.Title>
                <Typography.Text type="secondary" className="home-hero-metric-foot">
                  含待支付、制作中、已付待出餐
                </Typography.Text>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]} className="home-stat-row">
        {statCards.map((item) => (
          <Col key={item.key} xs={24} sm={12} lg={6}>
            <Card className={`home-stat-card home-stat-card--${item.accent}`} loading={loading}>
              <div className="home-stat-inner">
                {item.key === 'on_sale_menu' && can('menu:view') ? (
                  <Tooltip title="新标签打开全屏菜单展示">
                    <a
                      href={appPath('/menu-screen')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="home-stat-screen-pill"
                    >
                      <span className="home-stat-screen-pill-glow" aria-hidden />
                      <FundProjectionScreenOutlined className="home-stat-screen-pill-icon" />
                      <span className="home-stat-screen-pill-text">大屏</span>
                    </a>
                  </Tooltip>
                ) : null}
                <span className={`home-stat-icon home-stat-icon--${item.accent}`}>{item.icon}</span>
                <div className="home-stat-body">
                  <Statistic title={item.title} value={item.value} suffix={item.suffix} />
                  <Typography.Text type="secondary" className="home-stat-hint">
                    {item.hint}
                  </Typography.Text>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="home-history-card" loading={loading}>
        <div className="home-history-head">
          <div>
            <div className="home-history-headline">
              <Typography.Title level={5} className="home-history-title">
                近 14 天订单节奏
              </Typography.Title>
              <span className="home-history-badge">按日</span>
            </div>
            <Typography.Paragraph className="home-history-subtitle">
              自然日汇总订单量，快速感知客流起伏；柱高表示当日新建单数量。
            </Typography.Paragraph>
          </div>
          <div className="home-history-summary">
            <span className="home-history-summary-label">区间合计</span>
            <span className="home-history-total">{historyTotal} 单</span>
          </div>
        </div>

        <div className="home-history-chart-wrap">
          <div className="home-history-chart">
            {orderHistory.map((item) => (
              <div className="home-history-col" key={item.key}>
                <span className="home-history-value">{item.value}</span>
                <div className="home-history-bar-track">
                  <div className="home-history-bar" style={{ height: `${Math.max(8, Math.round((item.value / historyMax) * 100))}%` }} />
                </div>
                <span className="home-history-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <section className="home-entries-section">
        <div className="home-entries-intro">
          <Typography.Title level={4} className="page-section-title">
            按场景进入功能
          </Typography.Title>
          <Typography.Paragraph className="page-section-subtitle home-entries-lead">
            高频路径按前厅、后厨与配置分组，减少在侧边栏里来回找入口的时间。
          </Typography.Paragraph>
        </div>

        {entryGroups.map((group) => (
          <div key={group.title} className="home-entry-group">
            <div className="home-entry-group-head">
              <Typography.Title level={5} className="home-entry-group-title">
                {group.title}
              </Typography.Title>
              <Typography.Text type="secondary" className="home-entry-group-hint">
                {group.hint}
              </Typography.Text>
            </div>
            <Row gutter={[16, 16]}>
              {group.entries
                .filter((item) => !item.permission || can(item.permission))
                .map((item) => {
                  const card = (
                    <Card hoverable className={`home-entry-card home-entry-card--${item.accent}`}>
                      <div className="home-entry-top">
                        <span className={`home-entry-icon home-entry-icon--${item.accent}`}>{item.icon}</span>
                        <ArrowRightOutlined className="home-entry-arrow" />
                      </div>
                      <Typography.Title level={5} className="home-entry-title">
                        {item.title}
                      </Typography.Title>
                      <Typography.Paragraph type="secondary" className="home-entry-desc">
                        {item.description}
                      </Typography.Paragraph>
                      <span className="home-entry-cta">
                        {item.ctaLabel ?? '进入模块'} <ArrowRightOutlined />
                      </span>
                    </Card>
                  )
                  return (
                    <Col key={item.path} xs={24} sm={12} xl={8}>
                      {item.openInNewTab ? (
                        <a
                          href={appPath(item.path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="home-entry-link home-entry-link--blank"
                        >
                          {card}
                        </a>
                      ) : (
                        <Link to={item.path} className="home-entry-link">
                          {card}
                        </Link>
                      )}
                    </Col>
                  )
                })}
            </Row>
          </div>
        ))}
      </section>

      <div className="home-insight-panel">
        <BulbOutlined className="home-insight-icon" />
        <div>
          <Typography.Text strong className="home-insight-title">
            使用小贴士
          </Typography.Text>
          <Typography.Paragraph className="home-insight-desc">
            高峰时段可让前厅固定使用「点餐台」与「订单管理」，后厨盯住「工作台」出餐完成；闲时再到「菜单管理」「餐桌管理」做资料维护，分工更清晰。
          </Typography.Paragraph>
        </div>
      </div>
    </div>
  )
}
