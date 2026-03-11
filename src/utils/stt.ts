/**
 * 语音识别工具函数（Speech-to-Text）
 * 使用浏览器原生的 Web Speech API
 */

export interface STTOptions {
  /** 语言代码，如 'zh-CN', 'en-US' */
  lang?: string
  /** 是否连续识别（默认 false，识别一次后停止） */
  continuous?: boolean
  /** 是否显示临时结果（默认 false） */
  interimResults?: boolean
  /** 最大识别时长（毫秒，默认 60000） */
  maxDuration?: number
}

export interface STTResult {
  /** 识别的文本 */
  text: string
  /** 是否完成（false 表示临时结果） */
  isFinal: boolean
  /** 置信度（0-1） */
  confidence?: number
}

/**
 * 检查浏览器是否支持语音识别
 */
export function isSTTSupported(): boolean {
  return (
    'webkitSpeechRecognition' in window ||
    'SpeechRecognition' in window ||
    // @ts-ignore
    'SpeechRecognition' in window
  )
}

/**
 * 获取 SpeechRecognition 类
 */
function getSpeechRecognition(): typeof SpeechRecognition | null {
  if (typeof window === 'undefined') return null

  // @ts-ignore
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  return SpeechRecognition || null
}

/**
 * 语音识别
 * @param options 配置选项
 * @param onResult 识别结果回调
 * @returns 返回控制对象 { start, stop, abort }
 */
export function recognize(
  options: STTOptions = {},
  onResult: (result: STTResult) => void
): {
  start: () => void
  stop: () => void
  abort: () => void
} {
  const SpeechRecognition = getSpeechRecognition()
  if (!SpeechRecognition) {
    throw new Error('浏览器不支持语音识别')
  }

  const recognition = new SpeechRecognition()
  recognition.lang = options.lang || 'zh-CN'
  recognition.continuous = options.continuous ?? false
  recognition.interimResults = options.interimResults ?? false
  recognition.maxAlternatives = 1

  let timeoutId: NodeJS.Timeout | null = null
  const maxDuration = options.maxDuration || 60000

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const result = event.results[event.results.length - 1]
    const transcript = result[0]?.transcript || ''
    const confidence = result[0]?.confidence || 0

    onResult({
      text: transcript.trim(),
      isFinal: result.isFinal,
      confidence,
    })
  }

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    console.error('语音识别错误:', event.error)
  }

  recognition.onend = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  const start = () => {
    try {
      recognition.start()
      // 设置最大时长
      if (maxDuration > 0) {
        timeoutId = setTimeout(() => {
          recognition.stop()
        }, maxDuration)
      }
    } catch (error) {
      console.error('启动语音识别失败:', error)
    }
  }

  const stop = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    recognition.stop()
  }

  const abort = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    recognition.abort()
  }

  return { start, stop, abort }
}

/**
 * 语音识别（Promise 版本，识别一次）
 * @param options 配置选项
 * @returns Promise，返回识别的文本
 */
export function recognizeOnce(options: STTOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isSTTSupported()) {
      reject(new Error('浏览器不支持语音识别'))
      return
    }

    const { start, stop, abort } = recognize(
      { ...options, continuous: false, interimResults: false },
      (result) => {
        if (result.isFinal) {
          stop()
          resolve(result.text)
        }
      }
    )

    // 设置超时
    const timeout = setTimeout(() => {
      abort()
      reject(new Error('语音识别超时'))
    }, options.maxDuration || 10000)

    start()

    // 监听结束事件
    const SpeechRecognition = getSpeechRecognition()
    if (SpeechRecognition) {
      // 通过临时创建实例来监听全局事件
      const tempRec = new SpeechRecognition()
      tempRec.onend = () => {
        clearTimeout(timeout)
      }
    }
  })
}
