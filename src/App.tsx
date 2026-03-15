import { Suspense, lazy, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ConfigProvider, Spin, theme as antdTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AuthProvider, useAuth } from './contexts/AuthContext'
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
    <ErrorBoundary>
      <ConfigProvider
        locale={zhCN}
        theme={{
          algorithm: antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: '#1677ff',
            colorBgLayout: '#f4f7fb',
            colorBorderSecondary: '#e5eaf3',
            colorTextSecondary: '#667085',
            borderRadius: 14,
            fontSize: 14,
          },
          components: {
            Layout: {
              headerBg: '#ffffff',
              siderBg: '#0f172a',
              bodyBg: '#f4f7fb',
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
            Table: {
              headerBg: '#f8fafc',
              headerColor: '#344054',
              rowHoverBg: '#f5f9ff',
              borderColor: '#e4e7ec',
            },
            Tabs: {
              itemColor: '#667085',
              itemSelectedColor: '#1677ff',
              itemHoverColor: '#1677ff',
              inkBarColor: '#1677ff',
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
