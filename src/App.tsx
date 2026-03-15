import { Suspense, lazy, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ConfigProvider, Spin, theme as antdTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider, useThemeMode } from './contexts/ThemeContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import './App.css'

const MainLayout = lazy(() => import('./layouts/MainLayout'))
const Login = lazy(() => import('./pages/Login'))
const Home = lazy(() => import('./pages/Home'))
const MenuManage = lazy(() => import('./pages/MenuManage'))
const TableManage = lazy(() => import('./pages/TableManage'))
const OrderManage = lazy(() => import('./pages/OrderManage'))
const OrderDesk = lazy(() => import('./pages/OrderDesk'))
const Workbench = lazy(() => import('./pages/Workbench'))

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PageLoading() {
  return (
    <div className="app-page-loading">
      <Spin size="large" />
    </div>
  )
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="menu" element={<MenuManage />} />
          <Route path="tables" element={<TableManage />} />
          <Route path="orders" element={<OrderManage />} />
          <Route path="order-desk" element={<OrderDesk />} />
          <Route path="workbench" element={<Workbench />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  )
}

function AppShell() {
  const { isDark } = useThemeMode()

  return (
    <ErrorBoundary>
      <ConfigProvider
        locale={zhCN}
        theme={{
          algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: isDark ? '#60a5fa' : '#1677ff',
            colorBgLayout: isDark ? '#0f1115' : '#f4f7fb',
            colorBgContainer: isDark ? '#151922' : '#ffffff',
            colorBorderSecondary: isDark ? '#2b3342' : '#e5eaf3',
            colorTextSecondary: isDark ? '#9aa4b2' : '#667085',
            borderRadius: 14,
            fontSize: 14,
            controlItemBgHover: isDark ? '#1c2534' : '#f5f9ff',
            controlItemBgActive: isDark ? '#243144' : '#eff6ff',
          },
          components: {
            Layout: {
              headerBg: isDark ? '#151922' : '#ffffff',
              siderBg: isDark ? '#11151c' : '#f7f8fa',
              bodyBg: isDark ? '#0f1115' : '#f4f7fb',
            },
            Card: {
              borderRadiusLG: 18,
            },
            Button: {
              borderRadius: 10,
              controlHeight: 38,
            },
            Input: {
              borderRadius: 10,
            },
            Select: {
              borderRadius: 10,
            },
            Pagination: {
              itemActiveBg: isDark ? '#243144' : '#eff6ff',
              itemBg: isDark ? '#151922' : '#ffffff',
              itemSize: 32,
            },
            Modal: {
              borderRadiusLG: 24,
            },
            Table: {
              headerBg: isDark ? '#1b2430' : '#f8fafc',
              headerColor: isDark ? '#dbe2ee' : '#344054',
              rowHoverBg: isDark ? '#1a2331' : '#f5f9ff',
              borderColor: isDark ? '#2b3342' : '#e4e7ec',
            },
            Tabs: {
              itemColor: isDark ? '#9aa4b2' : '#667085',
              itemSelectedColor: isDark ? '#93c5fd' : '#1677ff',
              itemHoverColor: isDark ? '#93c5fd' : '#1677ff',
              inkBarColor: isDark ? '#93c5fd' : '#1677ff',
            },
            Tag: {
              borderRadiusSM: 8,
            },
          },
        }}
      >
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ConfigProvider>
    </ErrorBoundary>
  )
}
