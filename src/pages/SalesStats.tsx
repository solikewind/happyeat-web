import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Col,
  DatePicker,
  Row,
  Segmented,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd'
import type { TabsProps } from 'antd'
import { BarChartOutlined, ReloadOutlined, ShoppingOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { listDailyStats, listMenuStats, type DailyStatsPoint, type ListDailyStatsReply, type MenuStatsRow } from '../api/stats'
import {
  formatDayLabel,
  formatStatsDateRangeChinese,
  formatYuan,
  resolveStatsRange,
  type StatsRangePreset,
} from '../utils/statsRange'

const { RangePicker } = DatePicker

export default function SalesStats() {
  const [preset, setPreset] = useState<StatsRangePreset>('today')
  const [customRange, setCustomRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [loading, setLoading] = useState(false)
  const [dailyData, setDailyData] = useState<ListDailyStatsReply | null>(null)
  const [menuRows, setMenuRows] = useState<MenuStatsRow[]>([])

  const range = useMemo(
    () =>
      resolveStatsRange(
        preset,
        preset === 'custom' && customRange
          ? [customRange[0].toDate(), customRange[1].toDate()]
          : null,
      ),
    [preset, customRange],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { start_date: range.start_date, end_date: range.end_date }
      const [dailyRes, menuRes] = await Promise.all([listDailyStats(params), listMenuStats(params)])
      setDailyData(dailyRes)
      setMenuRows(Array.isArray(menuRes.rows) ? menuRes.rows : [])
    } catch {
      message.error('经营统计加载失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [range.end_date, range.start_date])

  useEffect(() => {
    if (preset === 'custom' && !customRange) return
    void load()
  }, [load, preset, customRange])

  const summary = dailyData?.summary
  const dailyPoints = dailyData?.daily ?? []
  const chartMax = Math.max(1, ...dailyPoints.map((p) => p.order_count))

  const todayPoint = dailyPoints.length > 0 ? dailyPoints[dailyPoints.length - 1] : null

  const menuTotalQty = menuRows.reduce((sum, row) => sum + row.quantity, 0)
  const menuTotalAmount = menuRows.reduce((sum, row) => sum + row.amount, 0)

  const tabItems: TabsProps['items'] = [
    {
      key: 'overview',
      label: '经营概览',
      children: (
        <>
          <Row gutter={[16, 16]} className="home-stat-row">
            <Col xs={24} sm={8}>
              <Card className="home-stat-card home-stat-card--blue" loading={loading}>
                <Statistic title="营业额" value={summary?.revenue ?? 0} prefix="¥" precision={2} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="home-stat-card home-stat-card--amber" loading={loading}>
                <Statistic title="有效订单" value={summary?.order_count ?? 0} suffix="单" />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="home-stat-card home-stat-card--emerald" loading={loading}>
                <Statistic title="售出份数" value={summary?.item_count ?? 0} suffix="份" />
              </Card>
            </Col>
          </Row>

          {preset === 'today' && todayPoint ? (
            <Card className="sales-stats-today-card" loading={loading} style={{ marginTop: 16 }}>
              <Typography.Text type="secondary">今日 0 点至今</Typography.Text>
              <Typography.Title level={2} style={{ margin: '8px 0 0' }}>
                {formatYuan(todayPoint.revenue)}
              </Typography.Title>
              <Space size="large" style={{ marginTop: 12 }}>
                <span>订单 {todayPoint.order_count}</span>
                <span>份数 {todayPoint.item_count}</span>
              </Space>
            </Card>
          ) : null}

          <Card className="home-history-card" loading={loading} style={{ marginTop: 16 }}>
            <div className="home-history-head">
              <div>
                <div className="home-history-headline">
                  <Typography.Title level={5} className="home-history-title">
                    {range.label}订单趋势
                  </Typography.Title>
                  <span className="home-history-badge">按日</span>
                </div>
                <Typography.Paragraph className="home-history-subtitle">
                  已支付 / 制作中 / 已完成订单，按创建日汇总。
                </Typography.Paragraph>
              </div>
              <div className="home-history-summary">
                <span className="home-history-summary-label">区间合计</span>
                <span className="home-history-total">{summary?.order_count ?? 0} 单</span>
              </div>
            </div>
            <div className="home-history-chart-wrap">
              <div className="home-history-chart">
                {dailyPoints.map((item: DailyStatsPoint) => (
                  <div className="home-history-col" key={item.date}>
                    <span className="home-history-value">{item.order_count}</span>
                    <div className="home-history-bar-track">
                      <div
                        className="home-history-bar"
                        style={{ height: `${Math.max(8, Math.round((item.order_count / chartMax) * 100))}%` }}
                      />
                    </div>
                    <span className="home-history-label">{formatDayLabel(item.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </>
      ),
    },
    {
      key: 'menus',
      label: `菜品明细 (${menuRows.length})`,
      children: (
        <Card loading={loading}>
          <Space wrap style={{ marginBottom: 16 }}>
            <Tag color="blue">售出 {menuTotalQty} 份</Tag>
            <Tag color="gold">金额 {formatYuan(menuTotalAmount)}</Tag>
          </Space>
          <Table
            rowKey={(row) => `${row.menu_name}|${row.spec_info ?? ''}`}
            pagination={{ pageSize: 20, showSizeChanger: true }}
            dataSource={menuRows}
            locale={{ emptyText: '该时段暂无售出记录' }}
            columns={[
              {
                title: '#',
                width: 56,
                render: (_v, _r, index) => index + 1,
              },
              {
                title: '菜品',
                dataIndex: 'menu_name',
                render: (name: string, row) => (
                  <div>
                    <Typography.Text strong>{name}</Typography.Text>
                    {row.spec_info ? (
                      <div>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {row.spec_info}
                        </Typography.Text>
                      </div>
                    ) : null}
                  </div>
                ),
              },
              {
                title: '销量',
                dataIndex: 'quantity',
                width: 100,
                render: (qty: number) => <Typography.Text strong>×{qty}</Typography.Text>,
              },
              {
                title: '金额',
                dataIndex: 'amount',
                width: 120,
                render: (amount: number) => <Tag color="red">{formatYuan(amount)}</Tag>,
              },
            ]}
          />
        </Card>
      ),
    },
  ]

  return (
    <div className="sales-stats-page">
      <Card className="sales-stats-toolbar" loading={loading}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
            <Space wrap>
              <BarChartOutlined />
              <Typography.Text strong>统计区间</Typography.Text>
              <Segmented
                value={preset}
                onChange={(v) => setPreset(v as StatsRangePreset)}
                options={[
                  { label: '今日', value: 'today' },
                  { label: '近 3 天', value: '3d' },
                  { label: '近 7 天', value: '7d' },
                  { label: '近 30 天', value: '30d' },
                  { label: '自定义', value: 'custom' },
                ]}
              />
            </Space>
            <Button icon={<ReloadOutlined />} onClick={() => void load()}>
              刷新
            </Button>
          </Space>
          {preset === 'custom' ? (
            <RangePicker
              format="YYYY年M月D日"
              value={customRange}
              onChange={(values) => {
                if (!values?.[0] || !values[1]) {
                  setCustomRange(null)
                  return
                }
                setCustomRange([values[0].startOf('day'), values[1].startOf('day')])
              }}
              disabledDate={(current) => current && current > dayjs().endOf('day')}
            />
          ) : (
            <Typography.Text type="secondary">
              {formatStatsDateRangeChinese(range.start_date, range.end_date)}
            </Typography.Text>
          )}
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            <ShoppingOutlined /> 统计范围：已支付 / 制作中 / 已完成订单，按订单创建时间（自然日）
          </Typography.Text>
        </Space>
      </Card>

      <Tabs defaultActiveKey="overview" items={tabItems} style={{ marginTop: 16 }} />
    </div>
  )
}
