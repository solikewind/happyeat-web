/**
 * Speech-to-Text helpers based on Web Speech API.
 */

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message: string
}

interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

export interface STTOptions {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
  maxDuration?: number
}

export interface STTResult {
  text: string
  isFinal: boolean
  confidence?: number
}

export function isSTTSupported(): boolean {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
}

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  // @ts-ignore
  const SpeechRecognitionCtor = (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ||
    (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition
  return SpeechRecognitionCtor || null
}

export function recognize(
  options: STTOptions = {},
  onResult: (result: STTResult) => void,
  callbacks?: {
    onEnd?: () => void
    onError?: (error: string) => void
  }
): {
  start: () => void
  stop: () => void
  abort: () => void
} {
  const SpeechRecognitionCtor = getSpeechRecognition()
  if (!SpeechRecognitionCtor) {
    throw new Error('Browser does not support speech recognition')
  }

  const recognition = new SpeechRecognitionCtor()
  recognition.lang = options.lang || 'zh-CN'
  recognition.continuous = options.continuous ?? false
  recognition.interimResults = options.interimResults ?? false
  recognition.maxAlternatives = 1

  let timeoutId: ReturnType<typeof setTimeout> | null = null
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
    console.error('Speech recognition error:', event.error)
    callbacks?.onError?.(event.error)
  }

  recognition.onend = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    callbacks?.onEnd?.()
  }

  const start = () => {
    try {
      recognition.start()
      if (maxDuration > 0) {
        timeoutId = setTimeout(() => {
          recognition.stop()
        }, maxDuration)
      }
    } catch (error) {
      console.error('Failed to start speech recognition:', error)
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

export function recognizeOnce(options: STTOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isSTTSupported()) {
      reject(new Error('Browser does not support speech recognition'))
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

    const timeout = setTimeout(() => {
      abort()
      reject(new Error('Speech recognition timeout'))
    }, options.maxDuration || 10000)

    start()

    const SpeechRecognitionCtor = getSpeechRecognition()
    if (SpeechRecognitionCtor) {
      const tempRec = new SpeechRecognitionCtor()
      tempRec.onend = () => {
        clearTimeout(timeout)
      }
    }
  })
}
