/**
 * 文本转语音工具函数
 * 使用浏览器原生的 Web Speech API
 */

export interface TTSOptions {
  /** 语言代码，如 'zh-CN', 'en-US' */
  lang?: string
  /** 语速，0.1 到 10，默认 1 */
  rate?: number
  /** 音调，0 到 2，默认 1 */
  pitch?: number
  /** 音量，0 到 1，默认 1 */
  volume?: number
  /** 语音名称（可选） */
  voice?: SpeechSynthesisVoice
}

/**
 * 检查浏览器是否支持语音合成
 */
export function isTTSSupported(): boolean {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

/**
 * 获取可用的语音列表
 */
export function getVoices(): SpeechSynthesisVoice[] {
  return speechSynthesis.getVoices()
}

/**
 * 等待语音列表加载完成
 */
export function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices()
    if (voices.length > 0) {
      resolve(voices)
      return
    }

    speechSynthesis.onvoiceschanged = () => {
      resolve(speechSynthesis.getVoices())
    }
  })
}

/**
 * 查找中文语音
 */
export function findChineseVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices()
  // 优先查找中文语音
  return (
    voices.find((v) => v.lang.startsWith('zh')) ||
    voices.find((v) => v.lang.includes('Chinese')) ||
    null
  )
}

/**
 * 文本转语音
 * @param text 要朗读的文本
 * @param options 配置选项
 * @returns Promise，朗读完成后 resolve
 */
export function speak(
  text: string,
  options: TTSOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isTTSSupported()) {
      reject(new Error('浏览器不支持语音合成'))
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)

    // 设置语言
    utterance.lang = options.lang || 'zh-CN'

    // 设置语音（如果指定了中文语音）
    if (options.voice) {
      utterance.voice = options.voice
    } else if (options.lang?.startsWith('zh')) {
      const chineseVoice = findChineseVoice()
      if (chineseVoice) {
        utterance.voice = chineseVoice
      }
    }

    // 设置语速（0.1 - 10，默认 1）
    utterance.rate = options.rate ?? 1

    // 设置音调（0 - 2，默认 1）
    utterance.pitch = options.pitch ?? 1

    // 设置音量（0 - 1，默认 1）
    utterance.volume = options.volume ?? 1

    // 朗读完成
    utterance.onend = () => {
      resolve()
    }

    // 朗读错误
    utterance.onerror = (error) => {
      reject(error)
    }

    // 开始朗读
    speechSynthesis.speak(utterance)
  })
}

/**
 * 停止当前朗读
 */
export function stop(): void {
  if (isTTSSupported()) {
    speechSynthesis.cancel()
  }
}

/**
 * 暂停当前朗读
 */
export function pause(): void {
  if (isTTSSupported()) {
    speechSynthesis.pause()
  }
}

/**
 * 恢复暂停的朗读
 */
export function resume(): void {
  if (isTTSSupported()) {
    speechSynthesis.resume()
  }
}

/**
 * 检查是否正在朗读
 */
export function isSpeaking(): boolean {
  return isTTSSupported() && speechSynthesis.speaking
}

/**
 * 检查是否已暂停
 */
export function isPaused(): boolean {
  return isTTSSupported() && speechSynthesis.paused
}
