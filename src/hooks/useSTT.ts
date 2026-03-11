import { useState, useCallback, useRef, useEffect } from 'react'
import { recognize, isSTTSupported, type STTOptions, type STTResult } from '../utils/stt'

export interface UseSTTReturn {
  /** 是否支持 STT */
  isSupported: boolean
  /** 是否正在识别 */
  listening: boolean
  /** 当前识别的文本 */
  transcript: string
  /** 开始识别 */
  start: () => void
  /** 停止识别 */
  stop: () => void
  /** 取消识别 */
  abort: () => void
  /** 识别一次（Promise） */
  recognizeOnce: (options?: STTOptions) => Promise<string>
}

/**
 * 语音识别 Hook
 * @param defaultOptions 默认配置选项
 */
export function useSTT(defaultOptions?: STTOptions): UseSTTReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<{ start: () => void; stop: () => void; abort: () => void } | null>(null)

  useEffect(() => {
    setIsSupported(isSTTSupported())
  }, [])

  const handleResult = useCallback((result: STTResult) => {
    setTranscript(result.text)
    if (result.isFinal) {
      setListening(false)
    }
  }, [])

  const start = useCallback(() => {
    if (!isSupported) {
      console.warn('浏览器不支持语音识别')
      return
    }

    try {
      setListening(true)
      setTranscript('')
      recognitionRef.current = recognize(defaultOptions || {}, handleResult)
      recognitionRef.current.start()
    } catch (error) {
      console.error('启动语音识别失败:', error)
      setListening(false)
    }
  }, [isSupported, defaultOptions, handleResult])

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setListening(false)
  }, [])

  const abort = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort()
      recognitionRef.current = null
    }
    setListening(false)
    setTranscript('')
  }, [])

  const recognizeOnce = useCallback(
    async (options?: STTOptions): Promise<string> => {
      if (!isSupported) {
        throw new Error('浏览器不支持语音识别')
      }

      setListening(true)
      setTranscript('')

      return new Promise((resolve, reject) => {
        let timeoutId: NodeJS.Timeout | null = null
        let isResolved = false

        try {
          const { start, stop, abort } = recognize(
            { ...defaultOptions, ...options, continuous: false, interimResults: false },
            (result) => {
              setTranscript(result.text)
              if (result.isFinal && !isResolved) {
                isResolved = true
                if (timeoutId) clearTimeout(timeoutId)
                stop()
                setListening(false)
                resolve(result.text)
              }
            }
          )

          // 设置超时
          const maxDuration = options?.maxDuration || defaultOptions?.maxDuration || 10000
          timeoutId = setTimeout(() => {
            if (!isResolved) {
              isResolved = true
              abort()
              setListening(false)
              reject(new Error('语音识别超时'))
            }
          }, maxDuration)

          start()
        } catch (error) {
          if (timeoutId) clearTimeout(timeoutId)
          setListening(false)
          reject(error)
        }
      })
    },
    [isSupported, defaultOptions]
  )

  return {
    isSupported,
    listening,
    transcript,
    start,
    stop,
    abort,
    recognizeOnce,
  }
}
