import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Checkbox, Col, Divider, Empty, Row, Select, Space, Tag, Typography, message } from 'antd'
import type { PermissionKey, RoleKey } from '../auth/permissions'
import {
  PERMISSION_DEFINITIONS,
  ROLE_LABELS,
} from '../auth/permissions'
import {
  fetchRolePermissionConfig,
  resetRolePermissionsConfig,
  saveRolePermissions,
  type PermissionStorageMode,
} from '../api/permission'

const EDITABLE_ROLES: RoleKey[] = ['super_admin', 'manager', 'cashier', 'kitchen', 'waiter']

export default function PermissionManage() {
  const [activeRole, setActiveRole] = useState<RoleKey>('manager')
  const [loading, setLoading] = useState(false)
  const [roleConfig, setRoleConfig] = useState<Record<RoleKey, PermissionKey[]>>({
    super_admin: [],
    manager: [],
    cashier: [],
    kitchen: [],
    waiter: [],
    unknown: [],
  })
  const [storageMode, setStorageMode] = useState<PermissionStorageMode>('local')
  const activePermissions = roleConfig[activeRole] ?? []

  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, { key: PermissionKey; label: string; scene: string }[]>()
    ;(Object.values(PERMISSION_DEFINITIONS) as Array<(typeof PERMISSION_DEFINITIONS)[PermissionKey]>).forEach((item) => {
      if (!groups.has(item.module)) groups.set(item.module, [])
      groups.get(item.module)!.push({
        key: item.key,
        label: item.label,
        scene: item.scene,
      })
    })
    return Array.from(groups.entries())
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const data = await fetchRolePermissionConfig()
      setRoleConfig(data.roles)
      setStorageMode(data.storageMode)
    } catch {
      message.error('加载权限配置失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const onToggle = (permission: PermissionKey, checked: boolean) => {
    const current = new Set(activePermissions)
    if (checked) current.add(permission)
    else current.delete(permission)
    const next = Array.from(current)
    setRoleConfig((prev) => ({ ...prev, [activeRole]: next }))
    void saveRolePermissions(activeRole, next)
      .then((mode) => setStorageMode(mode))
      .catch(() => {
        message.error('保存权限失败')
        void loadConfig()
      })
  }

  const resetCurrentRole = () => {
    void resetRolePermissionsConfig(activeRole)
      .then((mode) => {
        setStorageMode(mode)
        message.success(`已重置角色：${ROLE_LABELS[activeRole]}`)
        void loadConfig()
      })
      .catch(() => message.error('重置失败'))
  }

  const resetAllRoles = () => {
    void resetRolePermissionsConfig()
      .then((mode) => {
        setStorageMode(mode)
        message.success('已重置全部角色权限')
        void loadConfig()
      })
      .catch(() => message.error('重置失败'))
  }

  return (
    <div className="manage-shell">
      <Card className="manage-hero-card">
        <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
          权限管理
        </Typography.Title>
        <Typography.Text type="secondary">
          通过页面配置角色权限，不改代码即可调整导航、路由与按钮可用性（当前版本保存到浏览器本地）。
        </Typography.Text>
      </Card>

      <Card className="manage-panel-card" loading={loading}>
        <Alert
          type={storageMode === 'remote' ? 'success' : 'warning'}
          showIcon
          style={{ marginBottom: 12 }}
          message={storageMode === 'remote' ? '当前使用后端权限策略' : '当前使用本地回退策略（待后端接口上线）'}
        />
        <div className="manage-filter-bar">
          <div className="manage-filter-group">
            <Select
              value={activeRole}
              style={{ minWidth: 220 }}
              options={EDITABLE_ROLES.map((role) => ({
                value: role,
                label: ROLE_LABELS[role],
              }))}
              onChange={(value) => setActiveRole(value)}
            />
            <Tag color="blue">当前权限数 {activePermissions.length}</Tag>
          </div>
          <Space>
            <Button onClick={resetCurrentRole}>重置当前角色</Button>
            <Button danger onClick={resetAllRoles}>
              重置全部角色
            </Button>
          </Space>
        </div>
      </Card>

      <Card className="manage-panel-card" loading={loading}>
        {groupedPermissions.length === 0 ? (
          <Empty description="暂无权限定义" />
        ) : (
          <Space direction="vertical" size={18} style={{ width: '100%' }}>
            {groupedPermissions.map(([module, items]) => (
              <div key={module}>
                <Typography.Title level={5} style={{ margin: 0 }}>
                  {module}
                </Typography.Title>
                <Divider style={{ margin: '10px 0 14px' }} />
                <Row gutter={[14, 14]}>
                  {items.map((item) => (
                    <Col key={item.key} xs={24} md={12}>
                      <Card size="small">
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                          <Checkbox
                            checked={activePermissions.includes(item.key)}
                            onChange={(e) => onToggle(item.key, e.target.checked)}
                          >
                            {item.label}
                          </Checkbox>
                          <Typography.Text type="secondary">{item.scene}</Typography.Text>
                          <Typography.Text code>{item.key}</Typography.Text>
                        </Space>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            ))}
          </Space>
        )}
      </Card>
    </div>
  )
}
