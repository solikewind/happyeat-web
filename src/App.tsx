import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ConfigProvider, theme as antdTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import Home from './pages/Home'
import MenuManage from './pages/MenuManage'
import TableManage from './pages/TableManage'
import OrderManage from './pages/OrderManage'
import OrderDesk from './pages/OrderDesk'
import Workbench from './pages/Workbench'
import './App.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
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
