import { useState, useEffect, useCallback, useRef } from 'react'
import { speak, stop, pause, resume, isSpeaking, isPaused, waitForVoices, findChineseVoice, type TTSOptions } from '../utils/tts'

export interface UseTTSReturn {
  /** 是否支持 TTS */
  isSupported: boolean
  /** 是否正在朗读 */
  speaking: boolean
  /** 是否已暂停 */
  paused: boolean
  /** 朗读文本 */
  speak: (text: string, options?: TTSOptions) => Promise<void>
  /** 停止朗读 */
  stop: () => void
  /** 暂停朗读 */
  pause: () => void
  /** 恢复朗读 */
  resume: () => void
  /** 可用的语音列表 */
  voices: SpeechSynthesisVoice[]
  /** 中文语音 */
  chineseVoice: SpeechSynthesisVoice | null
}

/**
 * 文本转语音 Hook
 * @param defaultOptions 默认配置选项
 */
export function useTTS(defaultOptions?: TTSOptions): UseTTSReturn {
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [chineseVoice, setChineseVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  // 初始化：检查支持并加载语音列表
  useEffect(() => {
    const checkSupport = async () => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setIsSupported(false)
        return
      }

      setIsSupported(true)
      const availableVoices = await waitForVoices()
      setVoices(availableVoices)
      setChineseVoice(findChineseVoice())

      // 监听语音列表变化
      const handleVoicesChanged = () => {
        const newVoices = speechSynthesis.getVoices()
        setVoices(newVoices)
        setChineseVoice(findChineseVoice())
      }

      speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)

      return () => {
        speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
      }
    }

    checkSupport()
  }, [])

  // 监听朗读状态
  useEffect(() => {
    if (!isSupported) return

    const interval = setInterval(() => {
      setSpeaking(isSpeaking())
      setPaused(isPaused())
    }, 100)

    return () => clearInterval(interval)
  }, [isSupported])

  const handleSpeak = useCallback(
    async (text: string, options?: TTSOptions) => {
      if (!isSupported) {
        throw new Error('浏览器不支持语音合成')
      }

      // 合并默认选项
      const finalOptions = { ...defaultOptions, ...options }

      // 如果指定了中文语音，使用它
      if (!finalOptions.voice && chineseVoice) {
        finalOptions.voice = chineseVoice
      }

      setSpeaking(true)
      setPaused(false)

      try {
        await speak(text, finalOptions)
      } finally {
        setSpeaking(false)
        setPaused(false)
      }
    },
    [isSupported, defaultOptions, chineseVoice]
  )

  const handleStop = useCallback(() => {
    stop()
    setSpeaking(false)
    setPaused(false)
  }, [])

  const handlePause = useCallback(() => {
    pause()
    setPaused(true)
  }, [])

  const handleResume = useCallback(() => {
    resume()
    setPaused(false)
  }, [])

  return {
    isSupported,
    speaking,
    paused,
    speak: handleSpeak,
    stop: handleStop,
    pause: handlePause,
    resume: handleResume,
    voices,
    chineseVoice,
  }
}
