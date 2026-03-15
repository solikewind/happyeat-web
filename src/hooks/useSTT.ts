import { useState, useCallback, useRef, useEffect } from 'react'
import { recognize, isSTTSupported, type STTOptions, type STTResult } from '../utils/stt'

export interface UseSTTReturn {
  isSupported: boolean
  listening: boolean
  transcript: string
  finalTranscript: string
  start: () => void
  stop: () => void
  abort: () => void
  recognizeOnce: (options?: STTOptions) => Promise<string>
}

type RecognitionController = { start: () => void; stop: () => void; abort: () => void }

export function useSTT(defaultOptions?: STTOptions): UseSTTReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const recognitionRef = useRef<RecognitionController | null>(null)

  useEffect(() => {
    setIsSupported(isSTTSupported())
  }, [])

  const start = useCallback(() => {
    if (!isSupported) {
      console.warn('Browser does not support speech recognition')
      return
    }

    try {
      setListening(true)
      setTranscript('')
      setFinalTranscript('')
      recognitionRef.current = recognize(defaultOptions || {}, (result: STTResult) => {
        setTranscript(result.text)
        if (result.isFinal) {
          setFinalTranscript(result.text)
          if (!(defaultOptions?.continuous ?? false)) {
            setListening(false)
          }
        }
      })
      recognitionRef.current.start()
    } catch (error) {
      console.error('Failed to start speech recognition:', error)
      setListening(false)
    }
  }, [isSupported, defaultOptions])

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
    setFinalTranscript('')
  }, [])

  const recognizeOnce = useCallback(
    async (options?: STTOptions): Promise<string> => {
      if (!isSupported) {
        throw new Error('Browser does not support speech recognition')
      }

      setListening(true)
      setTranscript('')
      setFinalTranscript('')

      return new Promise((resolve, reject) => {
        let timeoutId: ReturnType<typeof setTimeout> | null = null
        let isResolved = false

        try {
          const { start: sttStart, stop: sttStop, abort: sttAbort } = recognize(
            { ...defaultOptions, ...options, continuous: false, interimResults: false },
            (result) => {
              setTranscript(result.text)
              if (result.isFinal && !isResolved) {
                isResolved = true
                if (timeoutId) clearTimeout(timeoutId)
                sttStop()
                setListening(false)
                setFinalTranscript(result.text)
                resolve(result.text)
              }
            }
          )

          const maxDuration = options?.maxDuration || defaultOptions?.maxDuration || 10000
          timeoutId = setTimeout(() => {
            if (!isResolved) {
              isResolved = true
              sttAbort()
              setListening(false)
              reject(new Error('Speech recognition timeout'))
            }
          }, maxDuration)

          sttStart()
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
    finalTranscript,
    start,
    stop,
    abort,
    recognizeOnce,
  }
}
