/*
  Runs before every test file. Node-environment tests skip it all (no window);
  jsdom ones get the browser APIs the renderer touches that jsdom lacks, and a
  cleanup between tests.
*/
import { afterEach } from 'vitest'

if (typeof window !== 'undefined') {
  const { cleanup, configure } = await import('@testing-library/react')
  /*
    The release's Intel Mac runner is several times slower than the rest, and a
    finished screen there took longer than the default second to appear: three
    Library tests failed one release for that alone. A wait that ends early is
    free on a fast machine.
  */
  configure({ asyncUtilTimeout: 5000 })
  const { forgetKept } = await import('../src/renderer/src/hooks/useKept')
  afterEach(() => {
    cleanup()
    // Tests share one window; a screen remembered from the last one is not this one's.
    forgetKept()
  })

  const w = window as unknown as Record<string, unknown>
  w.matchMedia ??= (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false
  })
  class Noop {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): unknown[] {
      return []
    }
  }
  w.ResizeObserver ??= Noop
  w.IntersectionObserver ??= Noop
  Element.prototype.scrollIntoView ??= function () {}
  Element.prototype.scrollTo ??= function () {} as typeof Element.prototype.scrollTo
  window.scrollTo = () => undefined
  ;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true
}
