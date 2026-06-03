import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Collapse,
  Divider,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd'
import type { PermissionCatalogItem } from '../api/rbac'
import {
  PRESET_ROLE_CODES,
  createIAMRole,
  deleteIAMRole,
  fetchPermissionCatalog,
  listIAMRoles,
  syncCasbinPolicies,
  type IAMRoleRow,
} from '../api/rbac'
import { fetchRolePermissionConfig, resetRolePermissionsConfig, saveRolePermissions } from '../api/permission'
import { getRoleLabel, permissionLabel, permissionModuleLabel } from '../auth/permissions'

function moduleOfCode(code: string): string {
  const i = code.indexOf(':')
  return i > 0 ? code.slice(0, i) : 'other'
}

export default function PermissionManage() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [catalog, setCatalog] = useState<PermissionCatalogItem[]>([])
  const [iamRoles, setIamRoles] = useState<IAMRoleRow[]>([])
  const [roleConfig, setRoleConfig] = useState<Record<string, string[]>>({})
  const [activeRole, setActiveRole] = useState<string>('')
  const [draftPermissions, setDraftPermissions] = useState<string[]>([])
  const [dirty, setDirty] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createForm] = Form.useForm<{ role_code: string; role_name: string }>()
  const [createSelected, setCreateSelected] = useState<string[]>([])

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [cat, cfg, rolesRes] = await Promise.all([
        fetchPermissionCatalog(),
        fetchRolePermissionConfig(),
        listIAMRoles({ current: 1, pageSize: 200 }),
      ])
      setCatalog(cat)
      setIamRoles(rolesRes.roles)
      setRoleConfig(cfg.roles)
      const roleCodes = rolesRes.roles.map((r) => r.role_code)
      const matrixRoles = Object.keys(cfg.roles)
      const first = roleCodes[0] ?? matrixRoles[0] ?? ''
      setActiveRole((prev) => (prev && (roleCodes.includes(prev) || matrixRoles.includes(prev)) ? prev : first))
    } catch {
      message.error('加载权限数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  useEffect(() => {
    const saved = roleConfig[activeRole] ?? []
    setDraftPermissions([...saved])
    setDirty(false)
  }, [activeRole, roleConfig])

  const groupedCatalog = useMemo(() => {
    const groups = new Map<string, PermissionCatalogItem[]>()
    for (const item of catalog) {
      const mod = moduleOfCode(item.code)
      if (!groups.has(mod)) groups.set(mod, [])
      groups.get(mod)!.push(item)
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [catalog])

  const roleOptions = useMemo(() => {
    const map = new Map<string, string>()
    iamRoles.forEach((r) => map.set(r.role_code, r.role_name || r.role_code))
    Object.keys(roleConfig).forEach((code) => {
      if (!map.has(code)) map.set(code, getRoleLabel(code))
    })
    return Array.from(map.entries()).map(([value, label]) => ({
      value,
      label: `${label} (${value})`,
    }))
  }, [iamRoles, roleConfig])

  const activeRoleMeta = iamRoles.find((r) => r.role_code === activeRole)
  const isPreset = PRESET_ROLE_CODES.has(activeRole)

  const onToggleDraft = (code: string, checked: boolean) => {
    setDraftPermissions((prev) => {
      const set = new Set(prev)
      if (checked) set.add(code)
      else set.delete(code)
      return Array.from(set)
    })
    setDirty(true)
  }

  const onSaveRole = async () => {
    if (!activeRole) return
    setSaving(true)
    try {
      await saveRolePermissions(activeRole, draftPermissions)
      setRoleConfig((prev) => ({ ...prev, [activeRole]: [...draftPermissions] }))
      setDirty(false)
      message.success('已保存并同步到后端')
      await syncCasbinPolicies()
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const onCreateRole = async () => {
    try {
      const values = await createForm.validateFields()
      const code = values.role_code.trim().toLowerCase()
      if (PRESET_ROLE_CODES.has(code)) {
        message.error('不能与系统预置角色编码重复')
        return
      }
      setCreateSubmitting(true)
      await createIAMRole({
        role_code: code,
        role_name: values.role_name?.trim() || code,
        permissions: createSelected,
      })
      message.success('角色已创建')
      setCreateOpen(false)
      createForm.resetFields()
      setCreateSelected([])
      await loadAll()
      setActiveRole(code)
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error('创建角色失败')
    } finally {
      setCreateSubmitting(false)
    }
  }

  const onDeleteRole = async () => {
    if (!activeRoleMeta?.id) {
      message.warning('仅可删除已在 IAM 中登记的角色')
      return
    }
    try {
      await deleteIAMRole(activeRoleMeta.id)
      message.success('角色已删除')
      await loadAll()
    } catch {
      message.error('删除失败（预置角色不可删）')
    }
  }

  const renderPermissionPicker = (selected: string[], onChange: (codes: string[]) => void) => (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {groupedCatalog.length === 0 ? (
        <Empty description="暂无权限目录" />
      ) : (
        groupedCatalog.map(([module, items]) => (
          <div key={module}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              {permissionModuleLabel(module)}
            </Typography.Title>
            <Divider style={{ margin: '10px 0 14px' }} />
            <Row gutter={[14, 14]}>
              {items.map((item) => {
                const checked = selected.includes(item.code)
                return (
                  <Col key={item.code} xs={24} lg={12}>
                    <Card size="small" className={checked ? 'permission-card--checked' : undefined}>
                      <Checkbox
                        checked={checked}
                        onChange={(e) => {
                          const set = new Set(selected)
                          if (e.target.checked) set.add(item.code)
                          else set.delete(item.code)
                          onChange(Array.from(set))
                        }}
                      >
                        <Typography.Text strong>{permissionLabel(item.code)}</Typography.Text>
                      </Checkbox>
                      <Typography.Paragraph type="secondary" style={{ margin: '6px 0 4px' }}>
                        {item.description}
                      </Typography.Paragraph>
                      <Typography.Text code style={{ fontSize: 12 }}>
                        {item.code}
                      </Typography.Text>
                      {item.endpoints?.length ? (
                        <Collapse
                          size="small"
                          style={{ marginTop: 8 }}
                          items={[
                            {
                              key: 'apis',
                              label: `接口 (${item.endpoints.length})`,
                              children: (
                                <ul style={{ margin: 0, paddingLeft: 18 }}>
                                  {item.endpoints.map((ep) => (
                                    <li key={`${ep.act}-${ep.obj}`}>
                                      <Tag color="blue">{ep.act}</Tag>
                                      <Typography.Text code style={{ fontSize: 11 }}>
                                        {ep.obj}
                                      </Typography.Text>
                                    </li>
                                  ))}
                                </ul>
                              ),
                            },
                          ]}
                        />
                      ) : null}
                    </Card>
                  </Col>
                )
              })}
            </Row>
          </div>
        ))
      )}
    </Space>
  )

  return (
    <div className="manage-shell permission-manage-shell">
      <Card className="manage-hero-card">
        <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
          权限与角色
        </Typography.Title>
        <Typography.Text type="secondary">
          从后端权限目录勾选接口权限，保存后写入 IAM 并投影到 Casbin。可创建自定义角色（非写死在代码里的固定角色列表）。
        </Typography.Text>
      </Card>

      <Card className="manage-panel-card" loading={loading}>
        <div className="manage-filter-bar">
          <div className="manage-filter-group">
            <Select
              showSearch
              placeholder="选择角色"
              style={{ minWidth: 280 }}
              value={activeRole || undefined}
              options={roleOptions}
              onChange={setActiveRole}
              optionFilterProp="label"
            />
            <Tag color="blue">已选 {draftPermissions.length} 项权限</Tag>
            {dirty ? <Tag color="orange">未保存</Tag> : null}
            {isPreset ? <Tag>系统预置</Tag> : <Tag color="green">自定义</Tag>}
          </div>
          <Space wrap>
            <Button type="primary" onClick={() => setCreateOpen(true)}>
              新建角色
            </Button>
            <Button type="primary" disabled={!activeRole || !dirty} loading={saving} onClick={() => void onSaveRole()}>
              保存权限
            </Button>
            <Button
              onClick={() => {
                void resetRolePermissionsConfig(activeRole).then(() => {
                  message.success('已重置')
                  void loadAll()
                })
              }}
              disabled={!activeRole}
            >
              重置当前角色
            </Button>
            <Button
              onClick={() => {
                void syncCasbinPolicies().then(() => message.success('Casbin 已同步'))
              }}
            >
              同步 Casbin
            </Button>
            {!isPreset && activeRoleMeta?.id ? (
              <Popconfirm title="确定删除该角色？" onConfirm={() => void onDeleteRole()}>
                <Button danger>删除角色</Button>
              </Popconfirm>
            ) : null}
          </Space>
        </div>
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 12 }}
          message="说明"
          description="每个权限码对应一组 HTTP 接口（见下方「接口」折叠）。保存后调用 PUT /rbac/role-permissions 并同步 Casbin；用户需通过 IAM 绑定该角色后，JWT 中的 role 与绑定一致方可生效（当前登录仍使用开发账号 JWT 中的 role）。"
        />
      </Card>

      <Card className="manage-panel-card" loading={loading}>
        {!activeRole ? (
          <Empty description="请先选择或新建角色" />
        ) : (
          renderPermissionPicker(draftPermissions, (codes) => {
            setDraftPermissions(codes)
            setDirty(true)
          })
        )}
      </Card>

      <Modal
        title="新建角色"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => void onCreateRole()}
        confirmLoading={createSubmitting}
        okText="创建并保存权限"
        cancelText="取消"
        width={920}
        centered
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role_code"
                label="角色编码"
                rules={[
                  { required: true, message: '请输入角色编码' },
                  {
                    pattern: /^[a-z][a-z0-9_]{1,31}$/,
                    message: '小写字母开头，仅含字母数字下划线，2~32 位',
                  },
                ]}
              >
                <Input placeholder="例如 floor_leader" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="role_name" label="角色名称">
                <Input placeholder="例如 楼面主管" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
        <Typography.Text type="secondary">勾选该角色拥有的权限（创建时一并写入后端）：</Typography.Text>
        <div style={{ marginTop: 12, maxHeight: 'min(52vh, 520px)', overflow: 'auto' }}>
          {renderPermissionPicker(createSelected, setCreateSelected)}
        </div>
      </Modal>
    </div>
  )
}
