# 文本转语音（TTS）功能使用指南

## 概述

本项目集成了基于浏览器原生 Web Speech API 的文本转语音功能，无需额外依赖和 API 密钥。

## 快速开始

### 方式一：使用 Hook（推荐）

```tsx
import { useTTS } from '../hooks/useTTS'

function MyComponent() {
  const { speak, isSupported } = useTTS({
    lang: 'zh-CN',
    rate: 1.2, // 语速
    pitch: 1.1, // 音调
  })

  if (!isSupported) {
    return <div>浏览器不支持语音合成</div>
  }

  return (
    <button onClick={() => speak('你好，欢迎使用')}>
      播放语音
    </button>
  )
}
```

### 方式二：直接使用工具函数

```tsx
import { speak } from '../utils/tts'

// 简单使用
await speak('新订单来了')

// 带配置使用
await speak('订单已完成', {
  lang: 'zh-CN',
  rate: 1.5,
  pitch: 1.2,
  volume: 0.8,
})
```

## API 文档

### useTTS Hook

#### 参数

```typescript
useTTS(defaultOptions?: TTSOptions)
```

- `defaultOptions`: 可选的默认配置选项

#### 返回值

```typescript
{
  isSupported: boolean        // 是否支持 TTS
  speaking: boolean           // 是否正在朗读
  paused: boolean             // 是否已暂停
  speak: (text, options?) => Promise<void>  // 朗读文本
  stop: () => void            // 停止朗读
  pause: () => void          // 暂停朗读
  resume: () => void         // 恢复朗读
  voices: SpeechSynthesisVoice[]  // 可用语音列表
  chineseVoice: SpeechSynthesisVoice | null  // 中文语音
}
```

### 工具函数

#### speak(text, options?)

朗读文本。

```typescript
await speak('文本内容', {
  lang: 'zh-CN',      // 语言代码
  rate: 1.0,          // 语速 (0.1-10)
  pitch: 1.0,         // 音调 (0-2)
  volume: 1.0,        // 音量 (0-1)
  voice: voiceObject  // 语音对象
})
```

#### stop()

停止当前朗读。

#### pause()

暂停当前朗读。

#### resume()

恢复暂停的朗读。

#### isSpeaking()

检查是否正在朗读。

#### isPaused()

检查是否已暂停。

## 使用场景示例

### 1. 工作台新订单提醒

```tsx
import { useTTS } from '../hooks/useTTS'
import { useEffect, useRef } from 'react'

function Workbench() {
  const { speak } = useTTS({ lang: 'zh-CN' })
  const previousOrderCountRef = useRef(0)

  useEffect(() => {
    // 假设 orders 是从 API 获取的订单列表
    const currentCount = orders.length
    const previousCount = previousOrderCountRef.current

    if (currentCount > previousCount) {
      const newCount = currentCount - previousCount
      speak(`您有 ${newCount} 个新订单需要处理`)
    }

    previousOrderCountRef.current = currentCount
  }, [orders.length, speak])

  // ...
}
```

### 2. 订单完成提示

```tsx
function handleOrderComplete(orderNo: string, tableCode?: string) {
  // 执行完成逻辑...
  
  if (tableCode) {
    speak(`桌号 ${tableCode} 的订单已完成`)
  } else {
    speak(`订单 ${orderNo} 已完成`)
  }
}
```

### 3. 带控制按钮的语音播放

```tsx
function TTSControl() {
  const { speak, stop, pause, resume, speaking, paused } = useTTS()

  return (
    <Space>
      <Button onClick={() => speak('播放内容')} disabled={speaking}>
        播放
      </Button>
      {speaking && (
        <>
          {paused ? (
            <Button onClick={resume}>继续</Button>
          ) : (
            <Button onClick={pause}>暂停</Button>
          )}
          <Button onClick={stop}>停止</Button>
        </>
      )}
    </Space>
  )
}
```

## 浏览器兼容性

- ✅ Chrome/Edge (推荐)
- ✅ Safari
- ✅ Firefox
- ⚠️ 部分移动浏览器可能支持有限

## 注意事项

1. **用户交互要求**：某些浏览器要求语音合成必须在用户交互（如点击）后触发
2. **语音列表加载**：首次使用时，语音列表可能需要时间加载
3. **中文语音**：系统会自动查找并使用中文语音，如果找不到会使用默认语音
4. **并发控制**：同时只能播放一个语音，新的播放会中断之前的

## 配置选项说明

- **lang**: 语言代码，如 `'zh-CN'`（中文）、`'en-US'`（英文）
- **rate**: 语速，范围 0.1 到 10，默认 1.0
- **pitch**: 音调，范围 0 到 2，默认 1.0
- **volume**: 音量，范围 0 到 1，默认 1.0
- **voice**: 特定的语音对象（从 `voices` 列表中选择）

## 故障排除

### 问题：没有声音

1. 检查浏览器是否支持：`isTTSSupported()`
2. 检查系统音量设置
3. 确保在用户交互后调用（某些浏览器要求）

### 问题：语音不是中文

1. 检查 `lang` 选项是否设置为 `'zh-CN'`
2. 检查系统是否安装了中文语音包
3. 尝试手动指定 `chineseVoice`

### 问题：语音列表为空

等待 `waitForVoices()` 完成后再使用。
