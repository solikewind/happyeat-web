import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Empty, Spin, Tooltip, Typography, message } from 'antd'
import { FullscreenExitOutlined, FullscreenOutlined, ReloadOutlined } from '@ant-design/icons'
import type { Menu } from '../api/types'
import { listMenus } from '../api/menu'

export default function MenuBigScreen() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(() => new Date())
  const [fs, setFs] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listMenus({ current: 1, pageSize: 500 })
      setMenus(Array.isArray(res?.menus) ? res.menus : [])
    } catch {
      message.error('加载菜品失败')
      setMenus([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    const onFs = () => setFs(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const timeStr = useMemo(
    () =>
      now.toLocaleString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    [now]
  )

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      message.warning('当前环境不支持全屏')
    }
  }

  return (
    <div className="menu-big-screen">
      <div className="menu-big-screen-bg" aria-hidden />
      <header className="menu-big-screen-header">
        <div className="menu-big-screen-actions">
          <time className="menu-big-screen-clock" dateTime={now.toISOString()}>
            {timeStr}
          </time>
          <div className="menu-big-screen-tools">
            <Tooltip title="刷新列表">
              <Button
                type="text"
                shape="circle"
                size="large"
                className="menu-big-screen-tool"
                icon={<ReloadOutlined />}
                loading={loading}
                onClick={() => void load()}
              />
            </Tooltip>
            <Tooltip title={fs ? '退出全屏' : '全屏显示'}>
              <Button
                type="text"
                shape="circle"
                size="large"
                className="menu-big-screen-tool"
                icon={fs ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={() => void toggleFullscreen()}
              />
            </Tooltip>
          </div>
        </div>
      </header>

      <div className="menu-big-screen-body">
        {loading && menus.length === 0 ? (
          <div className="menu-big-screen-loading">
            <Spin size="large" />
          </div>
        ) : menus.length === 0 ? (
          <Empty className="menu-big-screen-empty" description="暂无菜品" />
        ) : (
          <div className="menu-big-screen-grid">
            {menus.map((m, index) => (
              <article
                key={m.id}
                className="menu-big-screen-card"
                style={{ animationDelay: `${Math.min(index, 20) * 28}ms` }}
              >
                <div className="menu-big-screen-card-inner">
                  <div className="menu-big-screen-img-wrap">
                    <div className="menu-big-screen-img-fallback" aria-hidden>
                      暂无图片
                    </div>
                    {m.image ? (
                      <img
                        className="menu-big-screen-img"
                        src={m.image}
                        alt={m.name}
                        loading="lazy"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.visibility = 'hidden'
                        }}
                      />
                    ) : null}
                  </div>
                  <div className="menu-big-screen-name-row">
                    <Typography.Text className="menu-big-screen-name" ellipsis={{ tooltip: m.name }}>
                      {m.name}
                    </Typography.Text>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
