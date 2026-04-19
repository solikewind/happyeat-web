import { useState, type SetStateAction } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Avatar, Breadcrumb, Button, Drawer, Dropdown, Layout, Menu, Space, Tooltip, Typography } from 'antd'
import {
  DashboardOutlined,
  HomeOutlined,
  LayoutOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  SettingOutlined,
  SunOutlined,
  TableOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { OrderCartProvider } from '../contexts/OrderCartContext'
import { useThemeMode } from '../contexts/ThemeContext'
import type { PermissionKey } from '../auth/permissions'

const { Header, Sider, Content } = Layout

type NavItemConfig = {
  key: string
  icon: React.ReactNode
  label: string
  description: string
  permission: PermissionKey
}

const navItems: NavItemConfig[] = [
  { key: '/', icon: <HomeOutlined />, label: '首页', description: '经营概览与快捷入口', permission: 'home:view' },
  {
    key: '/workbench',
    icon: <DashboardOutlined />,
    label: '工作台',
    description: '后厨制作与出单处理',
    permission: 'workbench:view',
  },
  {
    key: '/orders',
    icon: <ShoppingOutlined />,
    label: '订单管理',
    description: '订单查询与状态跟进',
    permission: 'orders:view',
  },
  {
    key: '/order-desk',
    icon: <ShoppingCartOutlined />,
    label: '点餐台',
    description: '快速下单与购物车结算',
    permission: 'order_desk:view',
  },
  { key: '/menu', icon: <MenuOutlined />, label: '菜单管理', description: '维护菜品与分类信息', permission: 'menu:view' },
  { key: '/tables', icon: <TableOutlined />, label: '餐桌管理', description: '查看桌台状态和容量', permission: 'table:view' },
  {
    key: '/table-map',
    icon: <LayoutOutlined />,
    label: '餐桌平面图',
    description: '厅面布局与订单高亮',
    permission: 'table:view',
  },
  {
    key: '/permissions',
    icon: <SettingOutlined />,
    label: '权限管理',
    description: '角色权限矩阵与页面操作控制',
    permission: 'permission:view',
  },
]

const pageMeta = Object.fromEntries(navItems.map((item) => [item.key, item]))

function renderNavItemLabel(
  item: NavItemConfig,
  ctx: {
    selectedKey: string
    isBreakpointBroken: boolean
    collapsed: boolean
    setCollapsed: (value: SetStateAction<boolean>) => void
    onMobileClose?: () => void
  }
) {
  const showToggle = !ctx.isBreakpointBroken && !ctx.collapsed && item.key === ctx.selectedKey

  return (
    <div className="app-nav-item-label">
      <Link to={item.key} onClick={() => ctx.onMobileClose?.()}>
        <span>{item.label}</span>
      </Link>
      {showToggle ? (
        <Tooltip title={ctx.collapsed ? '展开侧边栏' : '收起侧边栏'}>
          <Button
            className="app-sider-toggle app-sider-toggle-in-menu"
            size="small"
            icon={ctx.collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              ctx.setCollapsed((prev) => !prev)
            }}
          />
        </Tooltip>
      ) : null}
    </div>
  )
}

export default function MainLayout() {
  const location = useLocation()
  const { logout, role, can } = useAuth()
  const { isDark, toggleTheme } = useThemeMode()
  const [collapsed, setCollapsed] = useState(false)
  const [isBreakpointBroken, setIsBreakpointBroken] = useState(false)
  const visibleNavItems = navItems.filter((item) => can(item.permission))
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const currentPage = pageMeta[location.pathname] ?? pageMeta['/']
  const selectedKey = visibleNavItems.find((item) => item.key === location.pathname)?.key ?? visibleNavItems[0]?.key ?? '/'

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: logout,
      },
    ],
  }

  return (
    <OrderCartProvider>
      <Layout className="app-shell">
        <Sider
          className="app-sider"
          theme="light"
          breakpoint="lg"
          width={264}
          collapsible
          trigger={null}
          collapsed={collapsed}
          collapsedWidth={isBreakpointBroken ? 0 : 84}
          onBreakpoint={(broken) => {
            setIsBreakpointBroken(broken)
            if (broken) setCollapsed(true)
            if (!broken) setMobileNavOpen(false)
          }}
        >
          <div className={`app-brand${collapsed ? ' is-collapsed' : ''}`}>
            <div className="app-brand-mark">H</div>
            {!collapsed && (
              <div>
                <div className="app-brand-title">HappyEat</div>
                <div className="app-brand-subtitle">餐饮经营后台</div>
              </div>
            )}
          </div>
          <Menu
            className="app-nav-menu"
            theme="light"
            selectedKeys={[selectedKey]}
            mode="inline"
            inlineCollapsed={collapsed}
            items={visibleNavItems.map((item) => ({
              key: item.key,
              icon: item.icon,
              title: item.label,
              label: renderNavItemLabel(item, {
                selectedKey,
                isBreakpointBroken,
                collapsed,
                setCollapsed,
              }),
            }))}
          />
          {!isBreakpointBroken && collapsed && (
            <div className="app-sider-seam-toggle">
              <Tooltip placement="right" title="展开侧边栏">
                <Button className="app-sider-seam-btn" icon={<MenuUnfoldOutlined />} onClick={() => setCollapsed(false)} />
              </Tooltip>
            </div>
          )}
        </Sider>

        <Layout className="app-main-layout">
          <Header className="app-header">
            <div>
              <Breadcrumb items={[{ title: 'HappyEat' }, { title: currentPage.label }]} />
              <Typography.Title level={3} className="app-page-title">
                {currentPage.label}
              </Typography.Title>
              <Typography.Text className="app-page-description">{currentPage.description}</Typography.Text>
            </div>
            <Space size={10}>
              {isBreakpointBroken && (
                <Tooltip title="打开菜单">
                  <Button className="app-theme-toggle" icon={<MenuOutlined />} onClick={() => setMobileNavOpen(true)} />
                </Tooltip>
              )}
              <Tooltip title={isDark ? '切换到日间模式' : '切换到夜间模式'}>
                <Button className="app-theme-toggle" icon={isDark ? <SunOutlined /> : <MoonOutlined />} onClick={toggleTheme} />
              </Tooltip>
              <Dropdown menu={userMenu} placement="bottomRight">
                <Space className="app-user-entry">
                  <Avatar size={36} icon={<UserOutlined />} />
                  <span>
                    <strong>{role || '未识别账号'}</strong>
                    <span className="app-user-role">当前角色</span>
                  </span>
                </Space>
              </Dropdown>
            </Space>
          </Header>

          <Drawer
            title="功能导航"
            placement="left"
            width={264}
            open={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
            styles={{ body: { padding: 12 } }}
          >
            <Menu
              className="app-nav-menu"
              theme="light"
              selectedKeys={[selectedKey]}
              mode="inline"
              items={visibleNavItems.map((item) => ({
                key: item.key,
                icon: item.icon,
                title: item.label,
                label: renderNavItemLabel(item, {
                  selectedKey,
                  isBreakpointBroken,
                  collapsed,
                  setCollapsed,
                  onMobileClose: () => setMobileNavOpen(false),
                }),
              }))}
            />
          </Drawer>

          <Content className="app-content">
            <div className="app-content-inner">
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </OrderCartProvider>
  )
}
