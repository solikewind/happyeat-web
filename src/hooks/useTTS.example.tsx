/**
 * TTS 使用示例
 * 
 * 这个文件展示了如何在不同场景下使用文本转语音功能
 */

import React from 'react'
import { useTTS } from './useTTS'
import { speak } from '../utils/tts'
import { Button, Space } from 'antd'
import { SoundOutlined, PauseOutlined, StopOutlined } from '@ant-design/icons'

// ============ 示例 1: 使用 Hook（推荐） ============

export function TTSExample1() {
  const { isSupported, speaking, paused, speak, stop, pause, resume } = useTTS({
    lang: 'zh-CN',
    rate: 1.2, // 语速稍快
    pitch: 1.1, // 音调稍高
  })

  if (!isSupported) {
    return <div>您的浏览器不支持语音合成功能</div>
  }

  return (
    <Space>
      <Button
        type="primary"
        icon={<SoundOutlined />}
        onClick={() => speak('欢迎使用 HappyEat 餐饮管理系统')}
        disabled={speaking}
      >
        播放欢迎语
      </Button>
      {speaking && (
        <>
          {paused ? (
            <Button icon={<SoundOutlined />} onClick={resume}>
              继续
            </Button>
          ) : (
            <Button icon={<PauseOutlined />} onClick={pause}>
              暂停
            </Button>
          )}
          <Button icon={<StopOutlined />} onClick={stop}>
            停止
          </Button>
        </>
      )}
    </Space>
  )
}

// ============ 示例 2: 直接使用工具函数 ============

export async function TTSExample2() {
  // 简单使用
  await speak('新订单来了')

  // 带配置使用
  await speak('订单号 12345 已完成', {
    lang: 'zh-CN',
    rate: 1.5, // 语速
    pitch: 1.2, // 音调
    volume: 0.8, // 音量
  })
}

// ============ 示例 3: 在工作台中使用（检测新订单） ============

export function WorkbenchTTSExample() {
  const { speak } = useTTS({ lang: 'zh-CN', rate: 1.2 })
  const [previousOrderCount, setPreviousOrderCount] = React.useState(0)

  // 假设这是订单列表
  const orders = [] // 从 API 获取的订单列表

  React.useEffect(() => {
    const currentOrderCount = orders.length

    // 检测到新订单
    if (currentOrderCount > previousOrderCount) {
      const newOrdersCount = currentOrderCount - previousOrderCount
      speak(`您有 ${newOrdersCount} 个新订单需要处理`)
    }

    setPreviousOrderCount(currentOrderCount)
  }, [orders.length, previousOrderCount, speak])

  return null // 这个组件只负责播放语音
}

// ============ 示例 4: 订单完成时播放语音 ============

export function OrderCompleteTTSExample() {
  const { speak } = useTTS()

  // 示例：在订单完成时播放语音
  async function handleOrderComplete(orderNo: string, tableCode?: string) {
    if (tableCode) {
      await speak(`桌号 ${tableCode} 的订单已完成`)
    } else {
      await speak(`订单 ${orderNo} 已完成`)
    }
  }

  return null
}

// ============ 示例 5: 自定义语音提示 ============

export function CustomTTSExample() {
  const { speak, voices, chineseVoice } = useTTS()

  // 使用特定的语音
  const handleSpeakWithVoice = () => {
    if (chineseVoice) {
      speak('使用中文语音播放', {
        voice: chineseVoice,
        rate: 1.0,
        pitch: 1.0,
      })
    }
  }

  return (
    <div>
      <p>可用语音数量: {voices.length}</p>
      <p>中文语音: {chineseVoice?.name || '未找到'}</p>
      <Button onClick={handleSpeakWithVoice}>播放</Button>
    </div>
  )
}
