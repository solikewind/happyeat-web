import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Form, Input, Space, Typography, message } from 'antd'
import { LockOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons'
import { login } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { isLoggedIn, setToken } = useAuth()

  useEffect(() => {
    if (isLoggedIn) navigate('/', { replace: true })
  }, [isLoggedIn, navigate])

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
                  统一管理点餐、桌台、菜单和订单流程，让前厅与后厨协作更顺畅。
                </Typography.Paragraph>
              </div>
              <Space direction="vertical" size={12}>
                <Typography.Text style={{ color: '#dbeafe' }}>
                  <SafetyCertificateOutlined /> 账号登录后自动进入管理后台
                </Typography.Text>
                <Typography.Text style={{ color: '#dbeafe' }}>
                  <SafetyCertificateOutlined /> 支持菜单维护、订单处理和工作台出单
                </Typography.Text>
              </Space>
            </Space>
          </div>

          <div className="login-form-panel">
            <Typography.Text type="secondary">欢迎回来</Typography.Text>
            <Typography.Title level={3} style={{ marginTop: 8 }}>
              登录系统
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
              请输入账号和密码，进入 HappyEat 管理后台。
            </Typography.Paragraph>

            <Form layout="vertical" onFinish={onFinish}>
              <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input prefix={<UserOutlined />} placeholder="请输入用户名" size="large" />
              </Form.Item>
              <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" size="large" />
              </Form.Item>
              <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" block loading={loading} size="large">
                  登录
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </Card>
    </div>
  )
}
