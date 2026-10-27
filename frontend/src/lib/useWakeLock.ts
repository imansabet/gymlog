import { useEffect } from 'react'

export function useWakeLock() {
  useEffect(() => {
    let sentinel: WakeLockSentinel | null = null

    const acquire = async () => {
      try {
        sentinel = (await navigator.wakeLock?.request('screen')) ?? null
      } catch {
        
      }
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire()
    }

    void acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      void sentinel?.release()
    }
  }, [])
}
