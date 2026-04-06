import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Form, Input, Space, Typography, message } from 'antd'
import { LockOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons'
import { login } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { isLoggedIn, setToken, can, logout } = useAuth()

  useEffect(() => {
    if (!isLoggedIn) return
    if (can('home:view')) {
      navigate('/', { replace: true })
      return
    }
    logout()
    message.warning('登录已失效或账号无访问权限，请重新登录或联系管理员')
  }, [isLoggedIn, can, navigate, logout])

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const res = await login(values)
      setToken(res.access_token)
      message.success('登录成功')
      navigate('/', { replace: true })
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      message.error(err.response?.data?.message ?? '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-shell-bg" aria-hidden="true">
        <span className="login-shell-orb login-shell-orb-1" />
        <span className="login-shell-orb login-shell-orb-2" />
        <span className="login-shell-orb login-shell-orb-3" />
      </div>
      <Card className="login-shell-card">
        <div className="login-grid">
          <div className="login-brand-panel">
            <Space direction="vertical" size={20}>
              <div className="app-brand-mark">H</div>
              <div>
                <Typography.Title level={2} style={{ color: '#fff', marginBottom: 10 }}>
                  HappyEat 餐饮经营后台
                </Typography.Title>
                <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.82)', fontSize: 15, marginBottom: 0 }}>
                  统一管理点餐、桌台、菜单与订单流程，支撑门店日常运营与权限管控。
                </Typography.Paragraph>
              </div>
              <Space direction="vertical" size={12}>
                <Typography.Text style={{ color: '#dbeafe' }}>
                  <SafetyCertificateOutlined /> 登录后按角色与权限进入对应功能模块
                </Typography.Text>
                <Typography.Text style={{ color: '#dbeafe' }}>
                  <SafetyCertificateOutlined /> 支持菜单维护、订单处理与工作台协同
                </Typography.Text>
              </Space>
            </Space>
          </div>

          <div className="login-form-panel">
            <Typography.Text type="secondary">账户登录</Typography.Text>
            <Typography.Title level={3} style={{ marginTop: 8, marginBottom: 0 }}>
              登录系统
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
              请输入企业分配的账号与密码。如遇权限问题请联系系统管理员。
            </Typography.Paragraph>

            <Form layout="vertical" onFinish={onFinish} className="login-form-business">
              <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input prefix={<UserOutlined />} placeholder="请输入用户名" size="large" />
              </Form.Item>
              <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" size="large" />
              </Form.Item>
              <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" block loading={loading} size="large" className="login-submit-business">
                  登录
                </Button>
              </Form.Item>
            </Form>
            <Typography.Paragraph type="secondary" className="login-form-footer-hint">
              请勿在公共设备保存密码 · {import.meta.env.MODE === 'production' ? '生产环境' : '开发环境'}
            </Typography.Paragraph>
          </div>
        </div>
      </Card>
    </div>
  )
}
