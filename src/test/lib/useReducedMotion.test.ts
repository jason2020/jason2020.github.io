import { act, renderHook } from '@testing-library/react'
import { useReducedMotion } from '@/lib/useReducedMotion'

describe('useReducedMotion', () => {
  function stubMediaQuery(matches: boolean) {
    const listeners: ((e: { matches: boolean }) => void)[] = []
    const mq = {
      matches,
      addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
        listeners.push(cb)
      },
      removeEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
        const idx = listeners.indexOf(cb)
        if (idx !== -1) listeners.splice(idx, 1)
      },
      // Update .matches on the object (the hook reads mq.matches, not the event),
      // then fire all registered listeners.
      _dispatch: (newMatches: boolean) => {
        mq.matches = newMatches
        for (const cb of listeners) cb({ matches: newMatches })
      },
    }
    // jsdom doesn't define matchMedia, so we stub it globally.
    vi.stubGlobal('matchMedia', () => mq)
    return mq
  }

  it('returns false when prefers-reduced-motion is not set', () => {
    stubMediaQuery(false)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })

  it('returns true when prefers-reduced-motion is set', () => {
    stubMediaQuery(true)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })

  it('updates reactively when the media query changes', () => {
    const mq = stubMediaQuery(false)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)

    act(() => mq._dispatch(true))
    expect(result.current).toBe(true)

    act(() => mq._dispatch(false))
    expect(result.current).toBe(false)
  })
})
