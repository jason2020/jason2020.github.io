// Adds jest-dom's custom matchers (toBeInTheDocument, toHaveAttribute, …) to Vitest's expect.
import '@testing-library/jest-dom/vitest'

// jsdom has no matchMedia; provide a default (no reduced motion) so components
// that read it render. Individual tests can still stub it for specific cases.
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}
