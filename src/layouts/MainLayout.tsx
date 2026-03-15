import { Link, Outlet, useLocation } from 'react-router-dom'
import { Avatar, Breadcrumb, Dropdown, Layout, Menu, Space, Typography } from 'antd'
import {
  DashboardOutlined,
  HomeOutlined,
  LogoutOutlined,
  MenuOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  TableOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { OrderCartProvider } from '../contexts/OrderCartContext'

const { Header, Sider, Content } = Layout

const navItems = [
  { key: '/', icon: <HomeOutlined />, label: '首页', description: '经营概览与快捷入口' },
  { key: '/workbench', icon: <DashboardOutlined />, label: '工作台', description: '后厨制作与出单处理' },
  { key: '/orders', icon: <ShoppingOutlined />, label: '订单管理', description: '订单查询与状态跟进' },
  { key: '/order-desk', icon: <ShoppingCartOutlined />, label: '点餐台', description: '快速下单与购物车结算' },
  { key: '/menu', icon: <MenuOutlined />, label: '菜单管理', description: '维护菜品与分类信息' },
  { key: '/tables', icon: <TableOutlined />, label: '餐桌管理', description: '查看桌台状态和容量' },
]

const pageMeta = Object.fromEntries(navItems.map((item) => [item.key, item]))

export default function MainLayout() {
  const location = useLocation()
  const { logout } = useAuth()
  const currentPage = pageMeta[location.pathname] ?? pageMeta['/']
  const selectedKey = navItems.find((item) => item.key === location.pathname)?.key ?? '/'

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
        <Sider className="app-sider" theme="dark" breakpoint="lg" collapsedWidth="0" width={264}>
          <div className="app-brand">
            <div className="app-brand-mark">H</div>
            <div>
              <div className="app-brand-title">HappyEat</div>
              <div className="app-brand-subtitle">餐饮经营后台</div>
            </div>
          </div>
          <div className="app-nav-caption">功能导航</div>
          <Menu
            className="app-nav-menu"
            theme="dark"
            selectedKeys={[selectedKey]}
            mode="inline"
            items={navItems.map((item) => ({
              ...item,
              label: (
                <Link to={item.key}>
                  <span>{item.label}</span>
                  <span className="app-nav-item-description">{item.description}</span>
                </Link>
              ),
            }))}
          />
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
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space className="app-user-entry">
                <Avatar size={36} icon={<UserOutlined />} />
                <span>
                  <strong>管理员</strong>
                  <span className="app-user-role">系统账户</span>
                </span>
              </Space>
            </Dropdown>
          </Header>

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
