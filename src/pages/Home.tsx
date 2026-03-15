import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, Card, Col, Row, Space, Statistic, Typography, message } from 'antd'
import {
  ArrowRightOutlined,
  DashboardOutlined,
  FireOutlined,
  MenuOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  TableOutlined,
} from '@ant-design/icons'
import { listMenus } from '../api/menu'
import { listOrders } from '../api/order'
import { listTables } from '../api/table'
import type { Order, Table } from '../api/types'

const HISTORY_DAYS = 14
const HISTORY_PAGE_SIZE = 200
const HISTORY_MAX_PAGES = 6

const links = [
  {
    path: '/menu',
    title: '菜单管理',
    description: '维护分类、菜品和规格，保障点餐页展示完整。',
    icon: <MenuOutlined />,
  },
  {
    path: '/tables',
    title: '餐桌管理',
    description: '查看餐桌分区、容量和当前状态，支持快速维护。',
    icon: <TableOutlined />,
  },
  {
    path: '/order-desk',
    title: '点餐台',
    description: '前台点单入口，支持菜品选择、规格组合和语音点餐。',
    icon: <ShoppingCartOutlined />,
  },
  {
    path: '/orders',
    title: '订单管理',
    description: '统一查询订单详情、跟进状态和处理异常订单。',
    icon: <ShoppingOutlined />,
  },
  {
    path: '/workbench',
    title: '工作台',
    description: '集中处理已支付和制作中的订单，提升出餐效率。',
    icon: <DashboardOutlined />,
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

export default function Home() {
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
            const oldestTs = Number(pageOrders[pageOrders.length - 1]?.create_at) || 0

            if (oldestTs > 0 && oldestTs < startTs) break
            if (allHistoryOrders.length >= totalOrders) break
          }
        }

        const historyMap = new Map(points.map((item) => [item.key, 0]))
        allHistoryOrders.forEach((item) => {
          const createAt = Number(item?.create_at) || 0
          if (!createAt || createAt < startTs) return
          const dayKey = formatDayKey(new Date(createAt * 1000))
          if (!historyMap.has(dayKey)) return
          historyMap.set(dayKey, (historyMap.get(dayKey) || 0) + 1)
        })

        setMenuTotal(Number(menuRes?.total) || 0)
        setTableTotal(Number(tableRes?.total) || 0)
        setBusyTableTotal(tables.filter((item: Table) => item.status === 'using').length)
        setOrderTotal(totalOrders)
        setPendingOrderTotal(
          firstPageOrders.filter((item: Order) => item.status === 'created' || item.status === 'paid' || item.status === 'preparing')
            .length
        )
        setOrderHistory(points.map((item) => ({ ...item, value: historyMap.get(item.key) || 0 })))
      } catch {
        message.error('首页概览加载失败')
      } finally {
        setLoading(false)
      }
    }

    loadOverview()
  }, [])

  const statCards = useMemo(
    () => [
      { title: '菜品总数', value: menuTotal, suffix: '份' },
      { title: '餐桌总数', value: tableTotal, suffix: '桌' },
      { title: '使用中餐桌', value: busyTableTotal, suffix: '桌' },
      { title: '待处理订单', value: pendingOrderTotal, suffix: '单' },
    ],
    [busyTableTotal, menuTotal, pendingOrderTotal, tableTotal]
  )

  const historyMax = useMemo(() => Math.max(1, ...orderHistory.map((item) => item.value)), [orderHistory])
  const historyTotal = useMemo(() => orderHistory.reduce((sum, item) => sum + item.value, 0), [orderHistory])

  return (
    <div>
      <Card className="home-hero-card" loading={loading}>
        <div className="home-hero-grid">
          <div>
            <Typography.Title level={2} className="home-hero-title">
              让点餐、出餐和桌台协同更顺畅
            </Typography.Title>
            <Typography.Text className="home-hero-subtitle">
              首页聚合当前经营数据和常用入口，前厅可以快速点单，后厨可以及时处理订单，管理端也能更快完成菜单与桌台维护。
            </Typography.Text>
            <Space wrap size="middle">
              <Link to="/order-desk">
                <Button className="app-accent-cta" type="primary" size="large" icon={<ShoppingCartOutlined />}>
                  进入点餐台
                </Button>
              </Link>
              <Link to="/workbench">
                <Button size="large" icon={<DashboardOutlined />}>
                  查看工作台
                </Button>
              </Link>
            </Space>
          </div>
          <div className="home-highlight-panel">
            <div className="home-highlight-item">
              <Typography.Text type="secondary">当前累计订单</Typography.Text>
              <Typography.Title level={3} style={{ margin: '6px 0 0' }}>
                {orderTotal} 单
              </Typography.Title>
            </div>
            <div className="home-highlight-item">
              <Typography.Text type="secondary">建议优先处理</Typography.Text>
              <Typography.Title level={4} style={{ margin: '6px 0 0' }}>
                已支付但未完成的订单
              </Typography.Title>
            </div>
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        {statCards.map((item) => (
          <Col key={item.title} xs={24} sm={12} lg={6}>
            <Card className="home-stat-card" loading={loading}>
              <Statistic title={item.title} value={item.value} suffix={item.suffix} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="home-history-card" loading={loading} style={{ marginTop: 20 }}>
        <div className="home-history-head">
          <div>
            <Typography.Title level={5} className="home-history-title">
              近14天订单历史
            </Typography.Title>
            <Typography.Text className="home-history-subtitle">按天统计订单量，方便查看近期波动趋势</Typography.Text>
          </div>
          <Typography.Text className="home-history-total">近14天总计 {historyTotal} 单</Typography.Text>
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

      <div className="page-toolbar" style={{ marginTop: 24 }}>
        <div>
          <Typography.Title level={4} className="page-section-title">
            常用入口
          </Typography.Title>
          <Typography.Text className="page-section-subtitle">
            建议把高频操作固定在首页，减少前厅和管理人员的切换成本。
          </Typography.Text>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {links.map((item) => (
          <Col key={item.path} xs={24} sm={12} xl={8}>
            <Link to={item.path}>
              <Card hoverable className="home-entry-card">
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <span className="home-entry-icon">{item.icon}</span>
                  <div>
                    <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
                      {item.title}
                    </Typography.Title>
                    <Typography.Text type="secondary">{item.description}</Typography.Text>
                  </div>
                  <Button type="link" style={{ padding: 0 }} icon={<ArrowRightOutlined />}>
                    立即进入
                  </Button>
                </Space>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      <Alert
        style={{ marginTop: 24, borderRadius: 16 }}
        type="info"
        showIcon
        icon={<FireOutlined />}
        message="优化建议"
        description="前厅高频使用“点餐台”和“工作台”，管理人员高频使用“菜单管理”和“餐桌管理”。首页已经按这个思路重组为概览加快捷入口。"
      />
    </div>
  )
}
